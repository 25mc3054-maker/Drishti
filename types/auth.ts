export type SecurityQuestion = {
  id: string;
  question: string;
};

export const SECURITY_QUESTIONS: SecurityQuestion[] = [
  { id: 'q1', question: "What was the name of the bank where you opened your very first business checking account?" },
  { id: 'q2', question: "What was the street name of your business's first physical office or storefront?" },
  { id: 'q3', question: "What was the last name of your first boss or supervisor?" },
  { id: 'q4', question: "What was the first trade show or professional conference you ever attended?" },
];