/**
 * Static Rubric Configuration for LLD evaluations.
 * Fixed 7-dimension criteria with clear descriptions and weights.
 */

const RUBRIC_CRITERIA = [
  {
    key: 'requirement_understanding',
    label: 'Requirement Understanding',
    description: 'Accurately interprets functional and non-functional requirements, constraints, and operational workflows.',
    weight: 1.0
  },
  {
    key: 'class_responsibilities',
    label: 'Class Responsibilities',
    description: 'Adherence to Single Responsibility Principle (SRP); classes have coherent, well-defined domain roles without god classes.',
    weight: 1.0
  },
  {
    key: 'coupling_cohesion',
    label: 'Coupling & Cohesion',
    description: 'High cohesion within classes and loose coupling between interacting components; dependencies are explicit.',
    weight: 1.0
  },
  {
    key: 'encapsulation_interfaces',
    label: 'Encapsulation & Interfaces',
    description: 'Information hiding, private state protection, clean public APIs, and interface-based design rather than concrete coupling.',
    weight: 1.0
  },
  {
    key: 'appropriate_abstraction',
    label: 'Appropriate Abstraction & Design Patterns',
    description: 'Judicious use of design patterns (Strategy, Factory, State, Observer, etc.) solving real problems without overengineering.',
    weight: 1.0
  },
  {
    key: 'extensibility',
    label: 'Extensibility & Open/Closed Principle',
    description: 'System can be extended with new features, spot types, state handlers, or algorithms without modifying existing tested logic.',
    weight: 1.0
  },
  {
    key: 'edge_cases',
    label: 'Edge Cases & Robustness',
    description: 'Handling edge conditions: concurrent access, capacity limits, invalid transitions, race conditions, failure recovery.',
    weight: 1.0
  }
];

const RUBRIC_KEYS = RUBRIC_CRITERIA.map(c => c.key);

const getCriterionByKey = (key) => RUBRIC_CRITERIA.find(c => c.key === key);

module.exports = {
  RUBRIC_CRITERIA,
  RUBRIC_KEYS,
  getCriterionByKey
};
