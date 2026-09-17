// Comprehensive question banks for field-based assessment system

import { ASSIGNMENT_CATEGORIES, DIFFICULTY_LEVELS } from './assignment.js';

// Question bank structure - organized by category and difficulty
export const QUESTION_BANKS = {
  // CODING QUESTIONS
  [ASSIGNMENT_CATEGORIES.CODING]: {
    [DIFFICULTY_LEVELS.EASY]: [
      {
        id: 'code_easy_1',
        question_text: 'What is the output of the following Python code?\n\nprint("Hello" + " " + "World")',
        options: ['A) Hello World', 'B) HelloWorld', 'C) Hello + World', 'D) Error'],
        correct_answer: 'A) Hello World',
        explanation: 'String concatenation with + operator joins the strings together.',
        vedic_connection: '',
        modern_application: 'String manipulation is fundamental in all programming languages and web development.'
      },
      {
        id: 'code_easy_2',
        question_text: 'Which of the following is the correct syntax to declare a variable in JavaScript?',
        options: ['A) var myVariable;', 'B) variable myVariable;', 'C) declare myVariable;', 'D) int myVariable;'],
        correct_answer: 'A) var myVariable;',
        explanation: 'JavaScript uses var, let, or const keywords to declare variables.',
        vedic_connection: '',
        modern_application: 'Variable declaration is essential for storing and manipulating data in web applications.'
      },
      {
        id: 'code_easy_3',
        question_text: 'What does HTML stand for?',
        options: ['A) Hyper Text Markup Language', 'B) High Tech Modern Language', 'C) Home Tool Markup Language', 'D) Hyperlink and Text Markup Language'],
        correct_answer: 'A) Hyper Text Markup Language',
        explanation: 'HTML is the standard markup language for creating web pages.',
        vedic_connection: '',
        modern_application: 'HTML forms the backbone of all web content and is essential for web development.'
      },
      {
        id: 'code_easy_4',
        question_text: 'Which CSS property is used to change the background color of an element?',
        options: ['A) background-color', 'B) color', 'C) bg-color', 'D) canvas-color'],
        correct_answer: 'A) background-color',
        explanation: 'background-color sets the background color of HTML elements.',
        vedic_connection: '',
        modern_application: 'CSS styling controls the visual presentation of web applications.'
      }
    ],
    [DIFFICULTY_LEVELS.MEDIUM]: [
      {
        id: 'code_medium_1',
        question_text: 'What is the time complexity of searching for an element in a balanced binary search tree?',
        options: ['A) O(log n)', 'B) O(n)', 'C) O(n²)', 'D) O(1)'],
        correct_answer: 'A) O(log n)',
        explanation: 'In a balanced BST, the height is log n, so search operations take O(log n) time.',
        vedic_connection: '',
        modern_application: 'Binary search trees are used in databases, file systems, and search algorithms.'
      },
      {
        id: 'code_medium_2',
        question_text: 'In object-oriented programming, what is inheritance?',
        options: ['A) The ability of a class to inherit properties and methods from another class', 'B) The process of hiding implementation details', 'C) The ability to use the same interface for different types', 'D) The bundling of data and methods together'],
        correct_answer: 'A) The ability of a class to inherit properties and methods from another class',
        explanation: 'Inheritance allows a class to inherit characteristics from a parent class, promoting code reuse.',
        vedic_connection: '',
        modern_application: 'Inheritance is fundamental in modern software architecture, enabling code reusability.'
      },
      {
        id: 'code_medium_3',
        question_text: 'Which data structure operates on a First In, First Out (FIFO) principle?',
        options: ['A) Queue', 'B) Stack', 'C) Binary Tree', 'D) Priority Queue'],
        correct_answer: 'A) Queue',
        explanation: 'A Queue processes items in the exact order they arrive (FIFO).',
        vedic_connection: '',
        modern_application: 'Queues are used in asynchronous job processing, print spooling, and request handling.'
      },
      {
        id: 'code_medium_4',
        question_text: 'Which HTTP method is idempotent and typically used to update an existing resource completely?',
        options: ['A) PUT', 'B) POST', 'C) PATCH', 'D) DELETE'],
        correct_answer: 'A) PUT',
        explanation: 'PUT is idempotent and replaces the target resource with the request payload.',
        vedic_connection: '',
        modern_application: 'REST APIs rely on correct HTTP verb selection for robust client-server interfaces.'
      }
    ],
    [DIFFICULTY_LEVELS.HARD]: [
      {
        id: 'code_hard_1',
        question_text: 'In a microservices architecture, what is the main challenge with distributed transactions?',
        options: ['A) Ensuring ACID properties across multiple services', 'B) Network latency', 'C) Service discovery', 'D) Load balancing'],
        correct_answer: 'A) Ensuring ACID properties across multiple services',
        explanation: 'Distributed transactions are complex because maintaining ACID properties across multiple services is challenging.',
        vedic_connection: '',
        modern_application: 'This is crucial for designing robust distributed systems in cloud computing.'
      },
      {
        id: 'code_hard_2',
        question_text: 'What design pattern uses a central orchestrator to manage distributed transactions via compensating actions?',
        options: ['A) Saga Pattern', 'B) Observer Pattern', 'C) Singleton Pattern', 'D) Factory Pattern'],
        correct_answer: 'A) Saga Pattern',
        explanation: 'The Saga pattern breaks transactions into local steps and uses compensating actions on failure.',
        vedic_connection: '',
        modern_application: 'Essential for maintaining consistency in microservices and distributed database systems.'
      }
    ]
  },

  // LOGIC QUESTIONS
  [ASSIGNMENT_CATEGORIES.LOGIC]: {
    [DIFFICULTY_LEVELS.EASY]: [
      {
        id: 'logic_easy_1',
        question_text: 'If all cats are animals, and Fluffy is a cat, what can we conclude?',
        options: ['A) Fluffy is an animal', 'B) All animals are cats', 'C) Fluffy is not an animal', 'D) We cannot conclude anything'],
        correct_answer: 'A) Fluffy is an animal',
        explanation: 'This is a basic syllogism. If all cats are animals and Fluffy is a cat, then Fluffy must be an animal.',
        vedic_connection: 'The Vedic tradition emphasizes logical reasoning through the Nyaya school of philosophy.',
        modern_application: 'Logical reasoning is fundamental in computer programming, legal arguments, and scientific research.'
      },
      {
        id: 'logic_easy_2',
        question_text: 'What comes next in the sequence: 2, 4, 6, 8, ?',
        options: ['A) 10', 'B) 12', 'C) 9', 'D) 14'],
        correct_answer: 'A) 10',
        explanation: 'This is a sequence of even numbers increasing by 2 each time.',
        vedic_connection: 'Pattern recognition was central to Vedic mathematics and astronomy.',
        modern_application: 'Pattern recognition is crucial in data analysis, machine learning, and problem-solving.'
      },
      {
        id: 'logic_easy_3',
        question_text: 'What is the next letter in the pattern: A, C, E, G, ?',
        options: ['A) I', 'B) H', 'C) J', 'D) K'],
        correct_answer: 'A) I',
        explanation: 'The pattern skips every alternate letter in the alphabet (A+2 = C, C+2 = E, E+2 = G, G+2 = I).',
        vedic_connection: 'Sequential patterns were studied in Sanskrit meter and prosody.',
        modern_application: 'Alphabetical series reasoning tests analytical skills in competitive assessments.'
      },
      {
        id: 'logic_easy_4',
        question_text: 'If you are facing North and turn 90 degrees to your right twice, which direction are you facing?',
        options: ['A) South', 'B) East', 'C) West', 'D) North'],
        correct_answer: 'A) South',
        explanation: 'Facing North: 90° right = East. Another 90° right = South (180° total turn).',
        vedic_connection: 'Directional geometry (Dik-jnana) was used in Vedic altar construction.',
        modern_application: 'Spatial reasoning and directional logic are crucial in navigation algorithms and robotics.'
      }
    ],
    [DIFFICULTY_LEVELS.MEDIUM]: [
      {
        id: 'logic_medium_1',
        question_text: 'In a logic puzzle, if "Some doctors are teachers" and "All teachers are patient," what can we definitely conclude?',
        options: ['A) Some doctors are patient', 'B) All doctors are patient', 'C) No doctors are patient', 'D) All patient people are doctors'],
        correct_answer: 'A) Some doctors are patient',
        explanation: 'Since some doctors are teachers, and all teachers are patient, those doctors who are teachers must be patient.',
        vedic_connection: 'Logical deduction was systematized in ancient Indian logic (Nyaya).',
        modern_application: 'Logical reasoning is essential in database queries, legal reasoning, and system design.'
      },
      {
        id: 'logic_medium_2',
        question_text: 'If CODE is written as DPEF in a secret cipher, how is MATH written in the same cipher?',
        options: ['A) NBUI', 'B) LZSG', 'C) NBUJ', 'D) OCTJ'],
        correct_answer: 'A) NBUI',
        explanation: 'Each letter is shifted forward by 1 letter: M->N, A->B, T->U, H->I.',
        vedic_connection: 'Vedic cryptograms (Katapayadi) encoded astronomical constants in words.',
        modern_application: 'Caesar ciphers and shift patterns form the foundation of basic cryptography.'
      },
      {
        id: 'logic_medium_3',
        question_text: 'Which set relation best describes "Rectangles" and "Squares"?',
        options: ['A) All squares are rectangles', 'B) All rectangles are squares', 'C) No squares are rectangles', 'D) Squares and rectangles have no overlap'],
        correct_answer: 'A) All squares are rectangles',
        explanation: 'A square has four right angles and equal sides, fitting the definition of a rectangle.',
        vedic_connection: 'Geometric classifications were detailed in the Sulba Sutras.',
        modern_application: 'Venn diagrams and set theory form the core of SQL JOIN operations.'
      }
    ],
    [DIFFICULTY_LEVELS.HARD]: [
      {
        id: 'logic_hard_1',
        question_text: 'In a country where every person either always tells the truth or always lies, you meet three people. A says "B is a liar." B says "C is a liar." C says "A and B are both liars." Who is telling the truth?',
        options: ['A) Only C', 'B) Only A', 'C) Only B', 'D) A and B'],
        correct_answer: 'A) Only C',
        explanation: 'If A were telling the truth, then B is a liar. If B is a liar, then C is truthful. If C is truthful, then A and B are both liars, which contradicts A being truthful. So A must be a liar. Following this logic, only C is telling the truth.',
        vedic_connection: 'Complex logical paradoxes were explored in ancient Indian philosophical debates.',
        modern_application: 'Such logical puzzles help develop analytical thinking crucial for programming and system design.'
      },
      {
        id: 'logic_hard_2',
        question_text: 'If a logic gate outputs 1 only when both of its inputs are 1, what gate is it?',
        options: ['A) AND gate', 'B) OR gate', 'C) XOR gate', 'D) NOR gate'],
        correct_answer: 'A) AND gate',
        explanation: 'An AND gate produces a HIGH output (1) only if all inputs are HIGH (1).',
        vedic_connection: 'Binary logic concepts mirror Dwaita (dual) truth values in logic systems.',
        modern_application: 'Digital circuitry, ALU hardware design, and Boolean logic in programming.'
      }
    ]
  },

  // MATHEMATICS QUESTIONS
  [ASSIGNMENT_CATEGORIES.MATHEMATICS]: {
    [DIFFICULTY_LEVELS.EASY]: [
      {
        id: 'math_easy_1',
        question_text: 'What is 15% of 200?',
        options: ['A) 30', 'B) 25', 'C) 35', 'D) 40'],
        correct_answer: 'A) 30',
        explanation: '15% of 200 = (15/100) × 200 = 0.15 × 200 = 30',
        vedic_connection: 'Percentage calculations were efficiently handled in Vedic mathematics using mental calculation techniques.',
        modern_application: 'Percentage calculations are essential in finance, statistics, and data analysis.'
      },
      {
        id: 'math_easy_2',
        question_text: 'What is the perimeter of a rectangle with length 8 cm and width 5 cm?',
        options: ['A) 26 cm', 'B) 40 cm', 'C) 13 cm', 'D) 20 cm'],
        correct_answer: 'A) 26 cm',
        explanation: 'Perimeter = 2 × (length + width) = 2 × (8 + 5) = 26 cm.',
        vedic_connection: 'Geometric measurements were foundational in Sulba Sutra altar design.',
        modern_application: 'Perimeter and area calculations are used in engineering, architecture, and graphics.'
      },
      {
        id: 'math_easy_3',
        question_text: 'What is the square root of 144?',
        options: ['A) 12', 'B) 14', 'C) 16', 'D) 10'],
        correct_answer: 'A) 12',
        explanation: '12 × 12 = 144, so the square root of 144 is 12.',
        vedic_connection: 'Vedic math methods (Vargamula) solved square roots rapidly.',
        modern_application: 'Square roots are fundamental in distance formulas, physics, and statistics.'
      },
      {
        id: 'math_easy_4',
        question_text: 'Simplify the ratio 12:18 to its lowest terms.',
        options: ['A) 2:3', 'B) 3:4', 'C) 1:2', 'D) 4:5'],
        correct_answer: 'A) 2:3',
        explanation: 'Dividing both 12 and 18 by their greatest common divisor 6 yields 2:3.',
        vedic_connection: 'Ratios and proportions were central to ancient astronomical calculations.',
        modern_application: 'Aspect ratios, scaling, and financial ratios rely on simplified proportions.'
      }
    ],
    [DIFFICULTY_LEVELS.MEDIUM]: [
      {
        id: 'math_medium_1',
        question_text: 'Solve for x: 2x + 5 = 17',
        options: ['A) x = 6', 'B) x = 5', 'C) x = 7', 'D) x = 8'],
        correct_answer: 'A) x = 6',
        explanation: '2x + 5 = 17, so 2x = 17 - 5 = 12, therefore x = 12/2 = 6',
        vedic_connection: 'Algebraic problem-solving techniques were developed in ancient Indian mathematics.',
        modern_application: 'Linear equations are fundamental in engineering, economics, and optimization problems.'
      },
      {
        id: 'math_medium_2',
        question_text: 'A standard 6-sided die is rolled. What is the probability of getting a prime number (2, 3, or 5)?',
        options: ['A) 1/2', 'B) 1/3', 'C) 2/3', 'D) 1/6'],
        correct_answer: 'A) 1/2',
        explanation: 'Prime outcomes are {2, 3, 5} out of 6 possible outcomes: 3/6 = 1/2.',
        vedic_connection: 'Combinatorics and permutations (Prastara) were developed by Pingala.',
        modern_application: 'Probability is essential in risk management, machine learning, and statistics.'
      },
      {
        id: 'math_medium_3',
        question_text: 'Calculate simple interest on $1,000 for 3 years at an annual interest rate of 5%.',
        options: ['A) $150', 'B) $100', 'C) $200', 'D) $50'],
        correct_answer: 'A) $150',
        explanation: 'Simple Interest = Principal × Rate × Time = 1000 × 0.05 × 3 = $150.',
        vedic_connection: 'Ancient Indian commercial texts outlined interest calculation formulas (Vyavahara).',
        modern_application: 'Financial literacy, loan calculations, and investment analysis.'
      }
    ],
    [DIFFICULTY_LEVELS.HARD]: [
      {
        id: 'math_hard_1',
        question_text: 'What is the derivative of f(x) = x³ + 2x² - 5x + 3?',
        options: ['A) f\'(x) = 3x² + 4x - 5', 'B) f\'(x) = 3x² + 2x - 5', 'C) f\'(x) = x² + 4x - 5', 'D) f\'(x) = 3x² + 4x - 3'],
        correct_answer: 'A) f\'(x) = 3x² + 4x - 5',
        explanation: 'Using the power rule: d/dx(x³) = 3x², d/dx(2x²) = 4x, d/dx(-5x) = -5, d/dx(3) = 0',
        vedic_connection: 'Calculus concepts have roots in the infinite series work of medieval Indian mathematicians.',
        modern_application: 'Calculus is essential in physics, engineering, machine learning, and optimization.'
      },
      {
        id: 'math_hard_2',
        question_text: 'Evaluate log₂(32).',
        options: ['A) 5', 'B) 4', 'C) 6', 'D) 16'],
        correct_answer: 'A) 5',
        explanation: 'Since 2^5 = 32, log₂(32) = 5.',
        vedic_connection: 'Logarithmic growth scales mirror exponential series in ancient Indian prosody.',
        modern_application: 'Logarithms are used in algorithm complexity, audio decibels, and financial modeling.'
      }
    ]
  },

  // LANGUAGE QUESTIONS
  [ASSIGNMENT_CATEGORIES.LANGUAGE]: {
    [DIFFICULTY_LEVELS.EASY]: [
      {
        id: 'lang_easy_1',
        question_text: 'Which of the following is a synonym for "happy"?',
        options: ['A) Joyful', 'B) Sad', 'C) Angry', 'D) Confused'],
        correct_answer: 'A) Joyful',
        explanation: 'Joyful means feeling happiness and is therefore a synonym of happy.',
        vedic_connection: 'Sanskrit has rich vocabulary for emotional states, with words like "ananda" meaning bliss.',
        modern_application: 'Vocabulary skills are essential for effective communication in all professional fields.'
      },
      {
        id: 'lang_easy_2',
        question_text: 'Identify the noun in the sentence: "The quick brown fox jumps over the lazy dog."',
        options: ['A) Fox', 'B) Quick', 'C) Jumps', 'D) Over'],
        correct_answer: 'A) Fox',
        explanation: '"Fox" is a person, place, or thing, making it a noun in this sentence.',
        vedic_connection: 'Sanskrit grammar (Panini\'s Ashtadhyayi) systematically categorized parts of speech.',
        modern_application: 'Natural language processing parsers rely on part-of-speech tagging.'
      },
      {
        id: 'lang_easy_3',
        question_text: 'What is the antonym of the word "expand"?',
        options: ['A) Contract', 'B) Extend', 'C) Enlarge', 'D) Inflate'],
        correct_answer: 'A) Contract',
        explanation: 'Expand means to grow larger; contract means to decrease in size.',
        vedic_connection: 'Antonyms and semantic polarities were analyzed in ancient lexicons like Amarakosha.',
        modern_application: 'Precision in language prevents ambiguity in technical and legal documents.'
      },
      {
        id: 'lang_easy_4',
        question_text: 'Choose the correctly spelled word:',
        options: ['A) Necessary', 'B) Neccessary', 'C) Necesary', 'D) Neccessery'],
        correct_answer: 'A) Necessary',
        explanation: 'Necessary is spelled with one "c" and double "s".',
        vedic_connection: 'Phonetic precision (Shiksha) ensured exact oral recitation of texts.',
        modern_application: 'Professional correspondence and publishing require accurate spelling.'
      }
    ],
    [DIFFICULTY_LEVELS.MEDIUM]: [
      {
        id: 'lang_medium_1',
        question_text: 'What is the main theme of this passage: "Despite facing numerous challenges, the young entrepreneur continued to pursue her dreams with unwavering determination."',
        options: ['A) Perseverance and determination', 'B) Business challenges', 'C) Youth and age', 'D) Dreams and reality'],
        correct_answer: 'A) Perseverance and determination',
        explanation: 'The passage emphasizes continuing to pursue goals despite challenges, which demonstrates perseverance.',
        vedic_connection: 'The concept of dharma in Vedic literature emphasizes persistent pursuit of righteous goals.',
        modern_application: 'Reading comprehension is vital for academic success and professional document analysis.'
      },
      {
        id: 'lang_medium_2',
        question_text: 'What does the idiom "break the ice" mean?',
        options: ['A) To initiate conversation in a social setting', 'B) To freeze water', 'C) To end a friendship', 'D) To break a cold object'],
        correct_answer: 'A) To initiate conversation in a social setting',
        explanation: '"Break the ice" means to make people feel more comfortable in a new or awkward setting.',
        vedic_connection: 'Idiomatic expressions exist across all ancient and modern languages.',
        modern_application: 'Cross-cultural communication requires understanding figurative language.'
      },
      {
        id: 'lang_medium_3',
        question_text: 'Convert to passive voice: "The chef cooked a delicious meal."',
        options: ['A) A delicious meal was cooked by the chef.', 'B) A delicious meal is cooked by the chef.', 'C) The chef was cooking a delicious meal.', 'D) A meal was delicious by the chef.'],
        correct_answer: 'A) A delicious meal was cooked by the chef.',
        explanation: 'Passive voice shifts focus to the object: "A delicious meal was cooked by the chef."',
        vedic_connection: 'Passive voice constructs (Karmani prayoga) were rigorously mapped by Panini.',
        modern_application: 'Technical documentation often uses passive voice to emphasize process over author.'
      }
    ],
    [DIFFICULTY_LEVELS.HARD]: [
      {
        id: 'lang_hard_1',
        question_text: 'In the sentence "The CEO, who founded the company in 1985, announced her retirement," the clause "who founded the company in 1985" is:',
        options: ['A) A non-restrictive relative clause', 'B) A restrictive relative clause', 'C) An adverbial clause', 'D) A noun clause'],
        correct_answer: 'A) A non-restrictive relative clause',
        explanation: 'The clause is set off by commas and provides additional information about the CEO but is not essential to identify which CEO.',
        vedic_connection: '',
        modern_application: 'Understanding sentence structure is important for clear technical writing and legal documentation.'
      },
      {
        id: 'lang_hard_2',
        question_text: 'Which figure of speech combines contradictory terms for dramatic effect, such as "deafening silence"?',
        options: ['A) Oxymoron', 'B) Metaphor', 'C) Hyperbole', 'D) Simile'],
        correct_answer: 'A) Oxymoron',
        explanation: 'An oxymoron brings together two contradictory words to create a paradoxical emphasis.',
        vedic_connection: 'Virodhabhasa (apparent contradiction) was a popular figure of speech in Sanskrit poetry.',
        modern_application: 'Literary techniques enhance marketing copy, rhetoric, and creative writing.'
      }
    ]
  },

  // CULTURE QUESTIONS
  [ASSIGNMENT_CATEGORIES.CULTURE]: {
    [DIFFICULTY_LEVELS.EASY]: [
      {
        id: 'culture_easy_1',
        question_text: 'Which festival is known as the "Festival of Lights" in Indian culture?',
        options: ['A) Diwali', 'B) Holi', 'C) Dussehra', 'D) Eid'],
        correct_answer: 'A) Diwali',
        explanation: 'Diwali is celebrated with oil lamps and lights, symbolizing the victory of light over darkness.',
        vedic_connection: 'Diwali has roots in ancient Vedic traditions and celebrates the return of Lord Rama to Ayodhya.',
        modern_application: 'Understanding cultural festivals promotes diversity and inclusion in global workplaces.'
      },
      {
        id: 'culture_easy_2',
        question_text: 'Which ancient civilization is credited with inventing paper?',
        options: ['A) Ancient China', 'B) Ancient Egypt', 'C) Ancient Greece', 'D) Ancient Rome'],
        correct_answer: 'A) Ancient China',
        explanation: 'Paper was invented in Han dynasty China around the 2nd century BCE.',
        vedic_connection: 'In India, birch bark (Bhurjapatra) and palm leaves were traditionally used for manuscripts.',
        modern_application: 'Historical innovations shape modern publishing and information management.'
      },
      {
        id: 'culture_easy_3',
        question_text: 'What traditional garment is iconic in Japanese culture?',
        options: ['A) Kimono', 'B) Sari', 'C) Kilt', 'D) Hanbok'],
        correct_answer: 'A) Kimono',
        explanation: 'The Kimono is a T-shaped traditional Japanese garment worn for formal and ceremonial occasions.',
        vedic_connection: 'Traditional attire reflects climate, heritage, and philosophy in ancient cultures.',
        modern_application: 'Global fashion and cultural heritage preservation.'
      },
      {
        id: 'culture_easy_4',
        question_text: 'Which European city is widely known as the "Eternal City"?',
        options: ['A) Rome', 'B) Paris', 'C) Athens', 'D) Vienna'],
        correct_answer: 'A) Rome',
        explanation: 'Rome was nicknamed the Eternal City by ancient Roman poets due to its lasting influence.',
        vedic_connection: 'Ancient urban settlements like Varanasi share the title of enduring cultural centers.',
        modern_application: 'Heritage tourism and architectural history.'
      }
    ],
    [DIFFICULTY_LEVELS.MEDIUM]: [
      {
        id: 'culture_medium_1',
        question_text: 'Which ancient civilization is credited with the invention of democracy?',
        options: ['A) Ancient Greece', 'B) Ancient Rome', 'C) Ancient Egypt', 'D) Ancient India'],
        correct_answer: 'A) Ancient Greece',
        explanation: 'Ancient Athens is credited with developing the first known democratic system around 508 BCE.',
        vedic_connection: 'Ancient Indian texts like the Arthashastra also discussed various forms of governance.',
        modern_application: 'Understanding the origins of democracy helps appreciate modern democratic institutions.'
      },
      {
        id: 'culture_medium_2',
        question_text: 'The concept of "Ubuntu" from African philosophy means:',
        options: ['A) "I am because we are" - interconnectedness of humanity', 'B) Individual achievement and success', 'C) Separation of communities', 'D) Economic prosperity'],
        correct_answer: 'A) "I am because we are" - interconnectedness of humanity',
        explanation: 'Ubuntu emphasizes the interconnectedness of all people and the importance of community.',
        vedic_connection: 'Similar to the Vedic concept of "Vasudhaiva Kutumbakam" - the world is one family.',
        modern_application: 'Ubuntu philosophy influences modern approaches to leadership, conflict resolution, and social justice.'
      },
      {
        id: 'culture_medium_3',
        question_text: 'In which state of India did the classical dance form "Bharatanatyam" originate?',
        options: ['A) Tamil Nadu', 'B) Kerala', 'C) Odisha', 'D) Uttar Pradesh'],
        correct_answer: 'A) Tamil Nadu',
        explanation: 'Bharatanatyam originated in the temples of Tamil Nadu and is based on the Natya Shastra.',
        vedic_connection: 'Bharata Muni\'s Natya Shastra is considered the foundational Vedic text for performing arts.',
        modern_application: 'Preservation of classical performing arts in international cultural exchanges.'
      }
    ],
    [DIFFICULTY_LEVELS.HARD]: [
      {
        id: 'culture_hard_1',
        question_text: 'Which historic trade route network connected East Asia with the Mediterranean world for centuries?',
        options: ['A) The Silk Road', 'B) The Amber Road', 'C) The Incense Route', 'D) The Trans-Saharan Route'],
        correct_answer: 'A) The Silk Road',
        explanation: 'The Silk Road enabled trade, cultural exchange, and technological transfer between Asia and Europe.',
        vedic_connection: 'Ancient Indian ports like Lothal and Muziris traded spices and textiles along these networks.',
        modern_application: 'Global supply chains and international trade policy.'
      },
      {
        id: 'culture_hard_2',
        question_text: 'The Renaissance cultural movement originated in which Italian city during the 14th century?',
        options: ['A) Florence', 'B) Venice', 'C) Milan', 'D) Naples'],
        correct_answer: 'A) Florence',
        explanation: 'Florence was the cradle of the Renaissance, fostering groundbreaking art, science, and humanism.',
        vedic_connection: 'Golden ages of art and learning occurred across ancient Indian dynasties like the Guptas.',
        modern_application: 'Cross-disciplinary innovation combining art, science, and technology.'
      }
    ]
  },

  // VEDIC KNOWLEDGE QUESTIONS
  [ASSIGNMENT_CATEGORIES.VEDIC_KNOWLEDGE]: {
    [DIFFICULTY_LEVELS.EASY]: [
      {
        id: 'vedic_easy_1',
        question_text: 'What is the meaning of "Yoga" in Sanskrit?',
        options: ['A) Union or connection', 'B) Exercise', 'C) Meditation', 'D) Breathing'],
        correct_answer: 'A) Union or connection',
        explanation: 'Yoga comes from the Sanskrit root "yuj" meaning to unite or connect, referring to the union of individual consciousness with universal consciousness.',
        vedic_connection: 'Yoga is one of the six orthodox schools of Hindu philosophy mentioned in ancient Vedic texts.',
        modern_application: 'Yoga is now practiced worldwide for physical health, mental well-being, and stress management.'
      },
      {
        id: 'vedic_easy_2',
        question_text: 'How many primary Vedas form the foundational texts of Vedic literature?',
        options: ['A) 4', 'B) 7', 'C) 108', 'D) 12'],
        correct_answer: 'A) 4',
        explanation: 'The four Vedas are Rigveda, Samaveda, Yajurveda, and Atharvaveda.',
        vedic_connection: 'They contain hymns, rituals, philosophy, and scientific observations.',
        modern_application: 'Preservation of ancient textual heritage and comparative religious studies.'
      },
      {
        id: 'vedic_easy_3',
        question_text: 'What does the term "Ahimsa" signify in ancient Indian philosophy?',
        options: ['A) Non-violence and reverence for life', 'B) Truthfulness', 'C) Self-discipline', 'D) Renunciation'],
        correct_answer: 'A) Non-violence and reverence for life',
        explanation: 'Ahimsa means non-injury or non-violence in thought, word, and deed.',
        vedic_connection: 'Ahimsa is a core precept in Vedic, Jain, and Buddhist ethical systems.',
        modern_application: 'Ahimsa inspired global civil rights leaders including Mahatma Gandhi and Martin Luther King Jr.'
      },
      {
        id: 'vedic_easy_4',
        question_text: 'Which ancient Indian healthcare system is derived from Atharvaveda traditions?',
        options: ['A) Ayurveda', 'B) Siddha', 'C) Homeopathy', 'D) Acupuncture'],
        correct_answer: 'A) Ayurveda',
        explanation: 'Ayurveda is the traditional science of medicine and holistic well-being.',
        vedic_connection: 'Ayurveda is considered an Upaveda (secondary Veda) associated with Atharvaveda.',
        modern_application: 'Holistic wellness, preventative healthcare, and herbal medicine research.'
      }
    ],
    [DIFFICULTY_LEVELS.MEDIUM]: [
      {
        id: 'vedic_medium_1',
        question_text: 'What is the significance of the number 108 in Vedic tradition?',
        options: ['A) It represents cosmic harmony and completeness', 'B) It is just a random sacred number', 'C) It represents the number of gods', 'D) It is the number of Vedic verses'],
        correct_answer: 'A) It represents cosmic harmony and completeness',
        explanation: '108 has multiple significance: distance from Earth to Sun is about 108 times the Sun\'s diameter, and there are 108 Upanishads.',
        vedic_connection: '108 is considered sacred in many Vedic practices including the number of beads in a mala.',
        modern_application: 'Understanding such symbolism helps in appreciating cultural practices and meditation techniques.'
      },
      {
        id: 'vedic_medium_2',
        question_text: 'In ancient Indian mathematics, which scholar explicitly detailed rules for operating with Zero (Shunya)?',
        options: ['A) Brahmagupta', 'B) Aryabhata', 'C) Bhaskara II', 'D) Varahamihira'],
        correct_answer: 'A) Brahmagupta',
        explanation: 'Brahmagupta in Brahmasphutasiddhanta (628 CE) formulated mathematical rules for zero and negative numbers.',
        vedic_connection: 'Zero developed from the philosophical concept of Shunya (emptiness/fullness).',
        modern_application: 'The concept of zero is the cornerstone of binary computation and digital technology.'
      },
      {
        id: 'vedic_medium_3',
        question_text: 'What are the four Purusharthas (legitimate goals of human life) in Vedic philosophy?',
        options: ['A) Dharma, Artha, Kama, Moksha', 'B) Satya, Ahimsa, Asteya, Daya', 'C) Rig, Sama, Yajur, Atharva', 'D) Vata, Pitta, Kapha, Ojas'],
        correct_answer: 'A) Dharma, Artha, Kama, Moksha',
        explanation: 'The four goals are Righteousness (Dharma), Wealth (Artha), Pleasure (Kama), and Liberation (Moksha).',
        vedic_connection: 'Provides a balanced framework for material prosperity and spiritual growth.',
        modern_application: 'Work-life balance and holistic life goal setting.'
      }
    ],
    [DIFFICULTY_LEVELS.HARD]: [
      {
        id: 'vedic_hard_1',
        question_text: 'In Vedic philosophy, what is the relationship between Atman and Brahman?',
        options: ['A) Atman (individual soul) is identical to Brahman (universal consciousness)', 'B) They are completely separate entities', 'C) Atman is superior to Brahman', 'D) Brahman is a part of Atman'],
        correct_answer: 'A) Atman (individual soul) is identical to Brahman (universal consciousness)',
        explanation: 'The Upanishads teach "Tat tvam asi" (Thou art That), indicating the fundamental unity of individual consciousness with universal consciousness.',
        vedic_connection: 'This is the core teaching of Advaita Vedanta philosophy.',
        modern_application: 'This philosophical understanding influences modern approaches to consciousness studies and psychology.'
      },
      {
        id: 'vedic_hard_2',
        question_text: 'Which ancient geometrical texts contained rules for constructing altars, effectively presenting early forms of the Pythagorean theorem?',
        options: ['A) Sulba Sutras', 'B) Surya Siddhanta', 'C) Lilavati', 'D) Panchasiddhantika'],
        correct_answer: 'A) Sulba Sutras',
        explanation: 'The Baudhayana Sulba Sutra (c. 800 BCE) contains geometric proofs including the Pythagorean relationship.',
        vedic_connection: 'Altar geometry required precise square-to-circle conversions and right-angled triangles.',
        modern_application: 'History of mathematics and geometric field applications.'
      }
    ]
  },

  // CURRENT AFFAIRS QUESTIONS
  [ASSIGNMENT_CATEGORIES.CURRENT_AFFAIRS]: {
    [DIFFICULTY_LEVELS.EASY]: [
      {
        id: 'current_easy_1',
        question_text: 'Which technology has become most prominent in recent years for creating realistic conversational AI?',
        options: ['A) Large Language Models (LLMs)', 'B) Blockchain', 'C) Virtual Reality', 'D) Quantum Computing'],
        correct_answer: 'A) Large Language Models (LLMs)',
        explanation: 'Large Language Models like GPT and similar technologies have revolutionized conversational AI and natural language processing.',
        vedic_connection: '',
        modern_application: 'LLMs are transforming education, customer service, content creation, and many other industries.'
      },
      {
        id: 'current_easy_2',
        question_text: 'Which international space program aims to land the next humans on the Moon and establish a long-term lunar base?',
        options: ['A) Artemis Program', 'B) Apollo Program', 'C) Curiosity Mission', 'D) Voyager Project'],
        correct_answer: 'A) Artemis Program',
        explanation: 'NASA\'s Artemis program, partnered with international space agencies, targets returning humans to the Moon.',
        vedic_connection: '',
        modern_application: 'Space exploration drives scientific breakthroughs in materials science, communication, and energy.'
      },
      {
        id: 'current_easy_3',
        question_text: 'What major renewable energy source relies on photovoltaic cells to generate electricity directly from sunlight?',
        options: ['A) Solar Energy', 'B) Geothermal Energy', 'C) Hydroelectric Energy', 'D) Biomass Energy'],
        correct_answer: 'A) Solar Energy',
        explanation: 'Photovoltaic cells convert photons from sunlight directly into electrical current.',
        vedic_connection: 'Surya (Sun) was revered in Vedic texts as the ultimate source of energy for Earth.',
        modern_application: 'Solar power expansion is vital for achieving global zero-carbon emission targets.'
      },
      {
        id: 'current_easy_4',
        question_text: 'Which space telescope, launched in late 2021, has provided unprecedented deep-space infrared images of distant galaxies?',
        options: ['A) James Webb Space Telescope', 'B) Hubble Space Telescope', 'C) Spitzer Space Telescope', 'D) Kepler Observatory'],
        correct_answer: 'A) James Webb Space Telescope',
        explanation: 'JWST observes the universe in infrared, capturing stars and early galaxies formed shortly after the Big Bang.',
        vedic_connection: 'Vedic astronomy (Jyotisha) focused on cosmic observation and celestial movements.',
        modern_application: 'Deep space astrophysics expands human knowledge of cosmology and planetary formation.'
      }
    ],
    [DIFFICULTY_LEVELS.MEDIUM]: [
      {
        id: 'current_medium_1',
        question_text: 'Which international agreement focuses on limiting global warming to well below 2°C above pre-industrial levels?',
        options: ['A) Paris Agreement', 'B) Kyoto Protocol', 'C) Montreal Protocol', 'D) Geneva Convention'],
        correct_answer: 'A) Paris Agreement',
        explanation: 'The Paris Agreement, adopted in 2015, aims to limit global temperature rise to well below 2°C, preferably 1.5°C.',
        vedic_connection: 'The Vedic concept of living in harmony with nature aligns with climate action goals.',
        modern_application: 'Climate agreements drive policy changes, renewable energy adoption, and sustainable business practices.'
      },
      {
        id: 'current_medium_2',
        question_text: 'What major global economic trend involves securing supply chains for semiconductor microchips?',
        options: ['A) Semiconductor sovereignty and supply chain diversification', 'B) Complete elimination of hardware manufacturing', 'C) Shift back to vacuum tubes', 'D) Decentralization of raw silica production'],
        correct_answer: 'A) Semiconductor sovereignty and supply chain diversification',
        explanation: 'Global chip shortages led nations to pass legislation (e.g. CHIPS Act) to boost domestic semiconductor manufacturing.',
        vedic_connection: '',
        modern_application: 'Semiconductors power all modern electronics, smartphones, electric vehicles, and AI datacenters.'
      },
      {
        id: 'current_medium_3',
        question_text: 'India\'s unified digital payment system that enables instant bank-to-bank mobile transactions is called:',
        options: ['A) UPI (Unified Payments Interface)', 'B) SWIFT', 'C) Bitcoin', 'D) Paypal'],
        correct_answer: 'A) UPI (Unified Payments Interface)',
        explanation: 'UPI is a real-time payment system developed by NPCI that has transformed digital financial inclusion.',
        vedic_connection: '',
        modern_application: 'Digital Public Infrastructure (DPI) serves as a benchmark for worldwide fintech innovation.'
      },
      {
        id: 'current_medium_4',
        question_text: 'What are the United Nations Sustainable Development Goals (SDGs) targeting to achieve by 2030?',
        options: ['A) 17 global goals for peace, prosperity, and planet protection', 'B) 5 economic targets for space mining', 'C) 50 guidelines for social media use', 'D) 10 rules for global trade tariffs'],
        correct_answer: 'A) 17 global goals for peace, prosperity, and planet protection',
        explanation: 'The 17 SDGs address poverty, inequality, climate change, clean energy, and education globally.',
        vedic_connection: 'Echoes the universal prayer "Sarve Bhavantu Sukhinah" (May all beings be happy and healthy).',
        modern_application: 'ESG compliance, corporate responsibility, and international development policy.'
      }
    ],
    [DIFFICULTY_LEVELS.HARD]: [
      {
        id: 'current_hard_1',
        question_text: 'What is the potential impact of quantum computing on current cryptographic security systems?',
        options: ['A) It could break many current encryption methods, requiring new quantum-resistant algorithms', 'B) It will make all systems completely secure', 'C) It has no impact on cryptography', 'D) It only affects blockchain technology'],
        correct_answer: 'A) It could break many current encryption methods, requiring new quantum-resistant algorithms',
        explanation: 'Quantum computers could potentially break RSA and other current encryption methods, leading to the development of post-quantum cryptography.',
        vedic_connection: '',
        modern_application: 'Organizations are preparing for quantum-resistant security to protect sensitive data and communications.'
      },
      {
        id: 'current_hard_2',
        question_text: 'What digital currency format is being developed directly by central banks worldwide to complement physical cash?',
        options: ['A) Central Bank Digital Currency (CBDC)', 'B) Decentralized Cryptocurrency', 'C) Non-Fungible Token (NFT)', 'D) Commodity Token'],
        correct_answer: 'A) Central Bank Digital Currency (CBDC)',
        explanation: 'CBDCs are sovereign digital currencies issued by central banks to enhance payment efficiency and monetary policy.',
        vedic_connection: '',
        modern_application: 'Modern monetary system evolution, cross-border settlements, and financial technology.'
      }
    ]
  }
};

// Helper functions for question bank management
export function getQuestionsByCategory(category) {
  return QUESTION_BANKS[category] || {};
}

export function getQuestionsByCategoryAndDifficulty(category, difficulty) {
  return QUESTION_BANKS[category]?.[difficulty] || [];
}

export function getAllQuestions() {
  const allQuestions = [];
  Object.entries(QUESTION_BANKS).forEach(([category, difficulties]) => {
    Object.entries(difficulties).forEach(([difficulty, questions]) => {
      questions.forEach(question => {
        allQuestions.push({
          ...question,
          category,
          difficulty
        });
      });
    });
  });
  return allQuestions;
}

export function getRandomQuestions(category, difficulty, count) {
  const questions = getQuestionsByCategoryAndDifficulty(category, difficulty);
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function searchQuestions(searchTerm) {
  const allQuestions = getAllQuestions();
  return allQuestions.filter(question =>
    question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.explanation.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export default QUESTION_BANKS;