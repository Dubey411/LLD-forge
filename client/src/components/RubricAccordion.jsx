import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Scale, CheckCircle } from 'lucide-react';

const RUBRIC_CRITERIA_LIST = [
  {
    key: 'requirement_understanding',
    label: 'Requirement Understanding',
    description: 'Accurately interprets functional and non-functional requirements, constraints, and operational workflows.'
  },
  {
    key: 'class_responsibilities',
    label: 'Class Responsibilities',
    description: 'Adherence to Single Responsibility Principle (SRP); classes have coherent, well-defined domain roles without god classes.'
  },
  {
    key: 'coupling_cohesion',
    label: 'Coupling & Cohesion',
    description: 'High cohesion within classes and loose coupling between interacting components; dependencies are explicit.'
  },
  {
    key: 'encapsulation_interfaces',
    label: 'Encapsulation & Interfaces',
    description: 'Information hiding, private state protection, clean public APIs, and interface-based design rather than concrete coupling.'
  },
  {
    key: 'appropriate_abstraction',
    label: 'Appropriate Abstraction & Design Patterns',
    description: 'Judicious use of design patterns (Strategy, Factory, State, Observer, etc.) solving real problems without overengineering.'
  },
  {
    key: 'extensibility',
    label: 'Extensibility & Open/Closed Principle',
    description: 'System can be extended with new features, spot types, state handlers, or algorithms without modifying existing tested logic.'
  },
  {
    key: 'edge_cases',
    label: 'Edge Cases & Robustness',
    description: 'Handling edge conditions: concurrent access, capacity limits, invalid transitions, race conditions, failure recovery.'
  }
];

export default function RubricAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center space-x-2.5">
          <Scale className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Evaluation Rubric (7 Dimensions)</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            0-5 Score Scale
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            Your design will be evaluated by an AI architect and deterministic verification guards against these 7 dimensions.
            Every score requires exact cited evidence from your submission text.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {RUBRIC_CRITERIA_LIST.map((c, i) => (
              <div key={c.key} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs">
                <div className="flex items-center space-x-1.5 font-medium text-indigo-300 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{i + 1}. {c.label}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-normal">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
