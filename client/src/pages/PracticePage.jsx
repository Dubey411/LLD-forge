import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import MonospaceEditor from '../components/MonospaceEditor';
import PollingIndicator from '../components/PollingIndicator';
import EvaluationView from '../components/EvaluationView';
import RubricAccordion from '../components/RubricAccordion';
import { ArrowLeft, History, CheckCircle, AlertTriangle, FileCode } from 'lucide-react';

const STARTER_TEMPLATES = {
  'parking-lot': `// --- Low-Level Design: Parking Lot ---
// Vehicle Hierarchy
class Vehicle {
  constructor(licensePlate, type) {
    this.licensePlate = licensePlate;
    this.type = type; // MOTORCYCLE, COMPACT, LARGE, ELECTRIC
  }
}

// Spot Abstraction
class ParkingSpot {
  constructor(id, floorNumber, spotType) {
    this.id = id;
    this.floorNumber = floorNumber;
    this.spotType = spotType;
    this.isOccupied = false;
    this.currentVehicle = null;
  }

  canFitVehicle(vehicle) {
    if (this.isOccupied) return false;
    if (vehicle.type === "MOTORCYCLE") return true;
    if (vehicle.type === "COMPACT") return this.spotType !== "MOTORCYCLE";
    if (vehicle.type === "LARGE") return this.spotType === "LARGE";
    if (vehicle.type === "ELECTRIC") return this.spotType === "ELECTRIC";
    return false;
  }

  occupy(vehicle) {
    this.currentVehicle = vehicle;
    this.isOccupied = true;
  }

  vacate() {
    this.currentVehicle = null;
    this.isOccupied = false;
  }
}

// Strategy Pattern for Allocation
interface IParkingStrategy {
  findSpot(floors, vehicle);
}

class NearestFirstStrategy {
  findSpot(floors, vehicle) {
    for (const floor of floors) {
      const spot = floor.spots.find(s => s.canFitVehicle(vehicle));
      if (spot) return spot;
    }
    return null;
  }
}

// Core Orchestrator
class ParkingLot {
  constructor(id, numFloors, spotsPerFloor) {
    this.id = id;
    this.floors = [];
    this.strategy = new NearestFirstStrategy();
    this.activeTickets = new Map();
  }

  parkVehicle(vehicle) {
    const spot = this.strategy.findSpot(this.floors, vehicle);
    if (!spot) throw new Error("Parking Lot Full");
    spot.occupy(vehicle);
    const ticket = { ticketId: Date.now(), spotId: spot.id, vehicle, entryTime: new Date() };
    this.activeTickets.set(ticket.ticketId, ticket);
    return ticket;
  }

  unparkVehicle(ticketId) {
    const ticket = this.activeTickets.get(ticketId);
    if (!ticket) throw new Error("Invalid Ticket");
    // Calculate fee and free spot
    this.activeTickets.delete(ticketId);
    return { fee: 20.0, vehicle: ticket.vehicle };
  }
}`,
  'elevator-system': `// --- Low-Level Design: Elevator System ---
enum Direction { UP, DOWN, IDLE }
enum ElevatorState { MOVING, STOPPED, DOORS_OPEN, MAINTENANCE }

class ElevatorRequest {
  constructor(sourceFloor, destinationFloor, direction) {
    this.sourceFloor = sourceFloor;
    this.destinationFloor = destinationFloor;
    this.direction = direction;
    this.timestamp = Date.now();
  }
}

class ElevatorCar {
  constructor(id, maxCapacityKg = 1000) {
    this.id = id;
    this.currentFloor = 1;
    this.direction = Direction.IDLE;
    this.state = ElevatorState.STOPPED;
    this.maxCapacityKg = maxCapacityKg;
    this.currentWeight = 0;
    this.internalDestinations = new Set();
  }

  addDestination(floor) {
    this.internalDestinations.add(floor);
  }

  step() {
    // Moves elevator car towards next target floor
  }
}

interface IDispatchStrategy {
  selectElevator(elevators, request);
}

class LookDispatchStrategy {
  selectElevator(elevators, request) {
    // Selects nearest elevator traveling in same direction with available capacity
    return elevators[0];
  }
}

class ElevatorController {
  constructor(numElevators, numFloors) {
    this.elevators = Array.from({ length: numElevators }, (_, i) => new ElevatorCar(i + 1));
    this.numFloors = numFloors;
    this.dispatcher = new LookDispatchStrategy();
  }

  requestElevator(sourceFloor, direction) {
    const req = new ElevatorRequest(sourceFloor, null, direction);
    const assigned = this.dispatcher.selectElevator(this.elevators, req);
    assigned.addDestination(sourceFloor);
    return assigned.id;
  }
}`,
  'vending-machine': `// --- Low-Level Design: Vending Machine ---
interface IVendingState {
  insertMoney(machine, amount);
  selectItem(machine, rackCode);
  dispense(machine);
  cancelTransaction(machine);
}

class IdleState {
  insertMoney(machine, amount) {
    machine.currentBalance += amount;
    machine.setState(new AcceptingMoneyState());
  }
  selectItem() { throw new Error("Insert money first."); }
  dispense() { throw new Error("No item selected."); }
  cancelTransaction() { return 0; }
}

class AcceptingMoneyState {
  insertMoney(machine, amount) {
    machine.currentBalance += amount;
  }
  selectItem(machine, rackCode) {
    const item = machine.inventory.get(rackCode);
    if (!item || item.quantity <= 0) throw new Error("Out of stock");
    if (machine.currentBalance < item.price) throw new Error("Insufficient funds");
    machine.selectedItem = item;
    machine.setState(new DispensingState());
  }
  cancelTransaction(machine) {
    const refund = machine.currentBalance;
    machine.currentBalance = 0;
    machine.setState(new IdleState());
    return refund;
  }
}

class DispensingState {
  dispense(machine) {
    const item = machine.selectedItem;
    item.quantity -= 1;
    const change = machine.currentBalance - item.price;
    machine.currentBalance = 0;
    machine.selectedItem = null;
    machine.setState(new IdleState());
    return { item, change };
  }
}

class VendingMachine {
  constructor() {
    this.inventory = new Map();
    this.currentBalance = 0;
    this.selectedItem = null;
    this.state = new IdleState();
  }
  setState(state) { this.state = state; }
  insertMoney(amt) { this.state.insertMoney(this, amt); }
  selectItem(code) { this.state.selectItem(this, code); }
  dispense() { return this.state.dispense(this); }
}`
};

export default function PracticePage({ problemSlug, onBack, onViewHistory, userId }) {
  const [problem, setProblem] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollStatus, setPollStatus] = useState(null); // 'pending' | 'evaluating' | null
  const [error, setError] = useState(null);

  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    initPracticeSession();
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [problemSlug]);

  const initPracticeSession = async () => {
    try {
      setError(null);
      // Fetch problem
      const probRes = await apiClient.getProblem(problemSlug);
      setProblem(probRes.data);

      // Start new attempt session
      const newAttempt = await apiClient.startAttempt(problemSlug, userId);
      setAttempt(newAttempt);

      // Reset state for new attempt
      setSubmission(null);
      setEvaluation(null);
      setPollStatus(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoadTemplate = () => {
    const template = STARTER_TEMPLATES[problemSlug] || `// Design classes and interfaces for ${problem?.title}\nclass MainSystem {\n  constructor() {}\n}\n`;
    setContent(template);
  };

  const handleSubmit = async () => {
    if (!attempt) return;
    try {
      setIsSubmitting(true);
      setError(null);

      // Submit design
      const res = await apiClient.submitAttempt(attempt.id, content, userId);
      const createdSub = res.submission;
      setSubmission(createdSub);

      // Start polling for evaluation result
      setPollStatus(createdSub.evaluationStatus || 'evaluating');
      startPolling(createdSub.id);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const startPolling = (submissionId) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const subData = await apiClient.getSubmission(submissionId);
        const currentSub = subData.submission;
        setSubmission(currentSub);
        setPollStatus(currentSub.evaluationStatus);

        if (currentSub.evaluationStatus === 'completed') {
          clearInterval(pollingIntervalRef.current);
          setEvaluation(subData.evaluation);
          setIsSubmitting(false);
          setPollStatus(null);
        } else if (currentSub.evaluationStatus === 'failed') {
          clearInterval(pollingIntervalRef.current);
          setIsSubmitting(false);
          setPollStatus(null);
          setError(currentSub.errorMessage || 'Evaluation failed. Please try submitting again.');
        }
      } catch (pollErr) {
        console.error('Polling error:', pollErr);
      }
    }, 2000); // Poll every ~2 seconds
  };

  const handleRetry = async () => {
    // Retry creates a new Attempt and resets editor
    await initPracticeSession();
  };

  if (!problem) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading problem workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{problem.title}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-800 text-indigo-400 border border-slate-700">
                {problem.difficulty}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Attempt #{attempt ? attempt.id?.slice(-5) : '...'} · User: <span className="font-mono text-indigo-300">{userId}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => onViewHistory(problemSlug)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center space-x-1.5 transition-colors"
        >
          <History className="w-4 h-4 text-indigo-400" />
          <span>Attempt History & Deltas</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-900/50 rounded-xl p-4 flex items-center space-x-3 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Dual-Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Problem Specs & Rubric Reference */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h2 className="text-sm uppercase tracking-wider font-bold text-slate-300 flex items-center space-x-1.5">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>Problem Description</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">{problem.description}</p>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Functional Requirements ({problem.requirements?.length})
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300 list-none">
                {(problem.requirements || []).map((req, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-indigo-400 font-mono text-[11px] font-bold mt-0.5">
                      {i + 1}.
                    </span>
                    <span className="leading-normal">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Constraints & Edge Cases
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300 list-none">
                {(problem.constraints || []).map((con, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-amber-400 font-mono text-[11px] font-bold mt-0.5">
                      !
                    </span>
                    <span className="leading-normal">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Rubric Accordion Reference */}
          <RubricAccordion />
        </div>

        {/* Right Column: Monospace Editor OR Polling Status OR Evaluation View */}
        <div className="lg:col-span-7">
          {pollStatus && !evaluation ? (
            <PollingIndicator status={pollStatus} />
          ) : evaluation ? (
            <EvaluationView
              evaluation={evaluation}
              submission={submission}
              onRetry={handleRetry}
              onViewHistory={() => onViewHistory(problemSlug)}
            />
          ) : (
            <MonospaceEditor
              content={content}
              onChange={setContent}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              problemTitle={problem.title}
              onLoadTemplate={handleLoadTemplate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
