require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const { Problem } = require('../models');

const SEED_PROBLEMS = [
  {
    slug: 'parking-lot',
    title: 'Design a Multi-Level Parking Lot System',
    difficulty: 'Medium',
    tags: ['OOP', 'Concurrency', 'Strategy Pattern', 'State Management'],
    description: `Design an automated parking lot management system spanning multiple floors. The system must coordinate vehicle entry, space allocation based on vehicle dimensions, ticket generation, rate calculation upon exit, and real-time display of available spots per floor.`,
    requirements: [
      'Support multiple vehicle types: Motorcycle, Compact Car, Large/SUV, Electric Vehicle (EV).',
      'Parking spots are categorized: Motorcycle, Compact, Large, and EV Spot with charging capability.',
      'A vehicle can only park in a compatible spot (e.g., Motorcycle can park in any spot, Compact in Compact/Large, Large only in Large, EV only in EV spots).',
      'Allocate spots using a dynamic parking strategy (e.g., nearest to entrance, lowest floor first, or best-fit).',
      'Issue a parking ticket with ticket ID, spot ID, entry timestamp, and vehicle details upon entry.',
      'Calculate parking fee upon exit based on elapsed time and dynamic pricing policy (hourly rate + vehicle tier).',
      'Real-time vacancy display board at the entrance of each floor updating remaining spots per category.',
      'Thread-safe concurrent parking and unparking at multiple entry/exit gates.'
    ],
    constraints: [
      'A parking lot has fixed floors (e.g., 4 floors), with 100 spots per floor.',
      'Cannot allocate a spot that is already occupied or reserved.',
      'Must handle peak hour concurrent entries without race conditions or double allocation.',
      'Payment can be made via Cash, Credit Card, or UPI, with extensible payment processors.'
    ]
  },
  {
    slug: 'elevator-system',
    title: 'Design an Elevator Management System',
    difficulty: 'Hard',
    tags: ['OOP', 'Scheduling Algorithms', 'State Pattern', 'Observer Pattern'],
    description: `Design a scalable elevator management system controlling a bank of multiple elevators in a high-rise commercial building. The system schedules elevators efficiently, responds to internal cabin requests and external floor calls, and handles safety limits.`,
    requirements: [
      'Manage a bank of N elevators servicing M floors.',
      'Handle external hall calls from floors with Direction (UP or DOWN).',
      'Handle internal cabin destination requests from passengers inside an elevator car.',
      'Elevator states: IDLE, MOVING_UP, MOVING_DOWN, DOORS_OPEN, MAINTENANCE.',
      'Pluggable scheduling and dispatch algorithm (e.g., FCFS, SCAN/LOOK elevator algorithm, or nearest elevator with minimal directional penalty).',
      'Emergency stop and overload alarm detection based on weight sensors.',
      'Door management with open/close timeout and safety obstacle sensor triggers.',
      'Floor display panel inside and outside cabins indicating current floor, direction, and operational state.'
    ],
    constraints: [
      'Elevator cars have a maximum passenger/weight capacity (e.g., 1000 kg or 12 persons).',
      'Must prevent starvations where a floor call is perpetually deferred during heavy traffic.',
      'State transitions must be atomic and race-condition free when multiple floor buttons are pressed simultaneously.'
    ]
  },
  {
    slug: 'vending-machine',
    title: 'Design a Smart Vending Machine',
    difficulty: 'Easy',
    tags: ['OOP', 'State Pattern', 'Inventory Management', 'Finite State Machine'],
    description: `Design the low-level architecture of a smart vending machine that accepts multiple denominations of coins and currency notes, dispenses selected items, computes change, and manages product inventory across multiple shelves.`,
    requirements: [
      'Support distinct operational states: NoMoneyInsertedState, MoneyInsertedState, DispensingState, OutOfStockState, MaintenanceState.',
      'Accept payment in multiple denominations (Coins: $0.10, $0.25, $1; Notes: $1, $5, $10) or digital contactless cards.',
      'Allow user to select an item by shelf/rack code (e.g., A1, B3).',
      'Verify that inserted money meets or exceeds the item price.',
      'Dispense item and compute optimal change return using available denomination inventory.',
      'Cancel transaction at any time before dispensing and return 100% of inserted money.',
      'Inventory tracking: deduct stock on dispense, prevent selection when item count is zero, and allow technician restocking.'
    ],
    constraints: [
      'If the machine cannot dispense exact change due to coin inventory exhaustion, refund money and abort transaction with a descriptive error message.',
      'Concurrent selection or cancellation attempts must maintain consistent financial and inventory state.',
      'Prices and shelf layouts should be dynamically configurable by maintenance staff.'
    ]
  }
];

const seed = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to DB, seeding problems...');

    for (const problemData of SEED_PROBLEMS) {
      const updated = await Problem.findOneAndUpdate(
        { slug: problemData.slug },
        { $set: problemData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[Seed] Seeded problem: ${updated.slug} (${updated.title})`);
    }

    console.log(`[Seed] Successfully seeded ${SEED_PROBLEMS.length} problems.`);
  } catch (error) {
    console.error(`[Seed] Seeding failed: ${error.message}`);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

if (require.main === module) {
  seed();
}

module.exports = { seed, SEED_PROBLEMS };
