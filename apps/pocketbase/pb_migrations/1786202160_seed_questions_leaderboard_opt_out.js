/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    // Add leaderboard_opt_out to profiles
    const profiles = app.findCollectionByNameOrId('profiles');
    try { profiles.fields.getByName('leaderboard_opt_out'); } catch (_) {
        profiles.fields.add(new BoolField({ name: 'leaderboard_opt_out' }));
        app.save(profiles);
    }

    // Update practice_sessions listRule to allow public reading of high-score completed sessions
    // (We'll use a server-side route for leaderboard instead; no rule change needed)

    const exams = ['waec', 'jamb', 'gce', 'neco', 'kcse'];
    const questionsCol = app.findCollectionByNameOrId('questions');

    const allQuestions = {
        'waec-english-language': [
            { prompt: 'Choose the option that best completes the gap: The teacher asked the students to _____ their assignments.', choices: ['submit', 'submits', 'submitted', 'submitting'], answer: 'submit', explanation: 'After "to" (infinitive marker), the base form of the verb is used.', difficulty: 'easy' },
            { prompt: 'Identify the figure of speech in: "The stars danced in the sky."', choices: ['Simile', 'Personification', 'Metaphor', 'Hyperbole'], answer: 'Personification', explanation: 'Stars cannot literally dance; giving them a human action is personification.', difficulty: 'easy' },
            { prompt: 'Select the sentence with correct use of the apostrophe:', choices: ["The boy's bag is heavy.", "The boys bag is heavy.", "The boys' bag is heavy.", "The boy is bag is heavy."], answer: "The boy's bag is heavy.", explanation: "An apostrophe + s shows singular possessive.", difficulty: 'medium' },
            { prompt: 'Which of these is a complex sentence?', choices: ['He ran fast.', 'She sang and danced.', 'Although it rained, they played.', 'He ate and slept.'], answer: 'Although it rained, they played.', explanation: 'A complex sentence contains a main clause and a subordinate clause.', difficulty: 'medium' },
            { prompt: 'The word "benevolent" most nearly means:', choices: ['cruel', 'kind', 'wise', 'lazy'], answer: 'kind', explanation: '"Benevolent" means well-meaning and kindly.', difficulty: 'easy' },
            { prompt: 'Choose the correctly spelt word:', choices: ['acheive', 'achieve', 'achiev', 'acheeve'], answer: 'achieve', explanation: 'The rule "i before e except after c" applies here.', difficulty: 'easy' },
            { prompt: 'Identify the tense: "By next year, she will have graduated."', choices: ['Simple future', 'Future continuous', 'Future perfect', 'Present perfect'], answer: 'Future perfect', explanation: 'Will have + past participle forms the future perfect tense.', difficulty: 'medium' },
            { prompt: '"A bolt from the blue" means:', choices: ['Lightning strike', 'An unexpected event', 'A rainstorm', 'A loud noise'], answer: 'An unexpected event', explanation: 'This idiom refers to something sudden and completely unexpected.', difficulty: 'medium' },
        ],
        'waec-mathematics': [
            { prompt: 'Simplify: 3x + 2y − x + 5y', choices: ['2x + 7y', '4x + 3y', '2x + 3y', '4x + 7y'], answer: '2x + 7y', explanation: 'Combine like terms: (3x − x) + (2y + 5y) = 2x + 7y.', difficulty: 'easy' },
            { prompt: 'Find the value of x: 2x − 5 = 11', choices: ['3', '6', '8', '4'], answer: '8', explanation: '2x = 16, so x = 8.', difficulty: 'easy' },
            { prompt: 'The area of a rectangle is 48 cm². If the length is 8 cm, find the width.', choices: ['4 cm', '6 cm', '5 cm', '7 cm'], answer: '6 cm', explanation: 'Area = length × width; 48 = 8 × w; w = 6.', difficulty: 'easy' },
            { prompt: 'Express 0.0045 in standard form.', choices: ['4.5 × 10⁻³', '4.5 × 10⁻⁴', '4.5 × 10⁻²', '0.45 × 10⁻²'], answer: '4.5 × 10⁻³', explanation: '0.0045 = 4.5 × 10⁻³.', difficulty: 'medium' },
            { prompt: 'What is 15% of 200?', choices: ['20', '25', '30', '35'], answer: '30', explanation: '15/100 × 200 = 30.', difficulty: 'easy' },
            { prompt: 'Factorise: x² − 9', choices: ['(x + 3)(x + 3)', '(x − 3)(x − 3)', '(x + 3)(x − 3)', '(x − 9)(x + 1)'], answer: '(x + 3)(x − 3)', explanation: 'Difference of two squares: a² − b² = (a+b)(a−b).', difficulty: 'medium' },
            { prompt: 'The mean of 4, 7, 9, x, and 5 is 6. Find x.', choices: ['3', '4', '5', '6'], answer: '5', explanation: 'Sum = 6×5 = 30; 4+7+9+x+5 = 30; 25+x = 30; x = 5.', difficulty: 'medium' },
            { prompt: 'If the radius of a circle is 7 cm, its circumference is (π = 22/7):', choices: ['22 cm', '44 cm', '154 cm', '88 cm'], answer: '44 cm', explanation: 'C = 2πr = 2 × 22/7 × 7 = 44 cm.', difficulty: 'easy' },
        ],
        'waec-biology': [
            { prompt: 'The powerhouse of the cell is the:', choices: ['Nucleus', 'Ribosome', 'Mitochondria', 'Vacuole'], answer: 'Mitochondria', explanation: 'Mitochondria produce ATP (energy) through cellular respiration.', difficulty: 'easy' },
            { prompt: 'Which blood group is the universal donor?', choices: ['A', 'B', 'AB', 'O'], answer: 'O', explanation: 'Blood group O negative is the universal donor as it lacks A and B antigens.', difficulty: 'easy' },
            { prompt: 'Photosynthesis occurs in the:', choices: ['Mitochondria', 'Nucleus', 'Chloroplast', 'Ribosome'], answer: 'Chloroplast', explanation: 'Chloroplasts contain chlorophyll used for photosynthesis.', difficulty: 'easy' },
            { prompt: 'The process by which plants lose water through their leaves is called:', choices: ['Osmosis', 'Transpiration', 'Respiration', 'Diffusion'], answer: 'Transpiration', explanation: 'Transpiration is the evaporation of water from plant leaves through stomata.', difficulty: 'easy' },
            { prompt: 'Chromosomes are made up of:', choices: ['RNA only', 'DNA and protein', 'DNA only', 'Protein only'], answer: 'DNA and protein', explanation: 'Chromosomes consist of DNA wrapped around histone proteins.', difficulty: 'medium' },
            { prompt: 'Which of the following is NOT a function of the liver?', choices: ['Production of bile', 'Detoxification', 'Production of insulin', 'Storage of glycogen'], answer: 'Production of insulin', explanation: 'Insulin is produced by the pancreas (beta cells of islets of Langerhans).', difficulty: 'medium' },
            { prompt: 'Osmosis is the movement of water from:', choices: ['High concentration to low concentration', 'Low concentration to high concentration', 'High water potential to low water potential', 'Low water potential to high water potential'], answer: 'High water potential to low water potential', explanation: 'Osmosis moves water through a semi-permeable membrane from high to low water potential.', difficulty: 'medium' },
            { prompt: 'The scientific name of humans is:', choices: ['Homo erectus', 'Homo sapiens', 'Homo habilis', 'Pan troglodytes'], answer: 'Homo sapiens', explanation: 'Modern humans are classified as Homo sapiens.', difficulty: 'easy' },
        ],
        'waec-chemistry': [
            { prompt: 'The atomic number of an element is defined as:', choices: ['The number of neutrons', 'The number of protons', 'The total number of particles', 'The mass of the atom'], answer: 'The number of protons', explanation: 'Atomic number = number of protons in the nucleus.', difficulty: 'easy' },
            { prompt: 'Which gas is produced when zinc reacts with dilute hydrochloric acid?', choices: ['Oxygen', 'Carbon dioxide', 'Hydrogen', 'Nitrogen'], answer: 'Hydrogen', explanation: 'Zn + 2HCl → ZnCl₂ + H₂↑', difficulty: 'easy' },
            { prompt: 'An acid has a pH of:', choices: ['7', 'Greater than 7', 'Less than 7', 'Equal to 14'], answer: 'Less than 7', explanation: 'Acids have pH < 7; neutral is 7; bases have pH > 7.', difficulty: 'easy' },
            { prompt: 'The chemical formula of water is:', choices: ['HO', 'H₂O', 'H₂O₂', 'HO₂'], answer: 'H₂O', explanation: 'Water contains 2 hydrogen atoms bonded to 1 oxygen atom.', difficulty: 'easy' },
            { prompt: 'Rusting is an example of:', choices: ['Reduction', 'Oxidation', 'Neutralisation', 'Decomposition'], answer: 'Oxidation', explanation: 'Rusting is the oxidation of iron: Fe → Fe₂O₃·nH₂O.', difficulty: 'easy' },
            { prompt: 'Which of these is a noble gas?', choices: ['Nitrogen', 'Chlorine', 'Argon', 'Fluorine'], answer: 'Argon', explanation: 'Noble gases (Group 0/18) include He, Ne, Ar, Kr, Xe, Rn.', difficulty: 'easy' },
            { prompt: 'The process of obtaining pure water from a salt solution is called:', choices: ['Filtration', 'Distillation', 'Crystallisation', 'Evaporation'], answer: 'Distillation', explanation: 'Distillation separates mixtures based on differences in boiling points.', difficulty: 'medium' },
            { prompt: 'An ion with a positive charge is called a:', choices: ['Anion', 'Cation', 'Neutron', 'Electron'], answer: 'Cation', explanation: 'Cations are positively charged ions formed by loss of electrons.', difficulty: 'easy' },
        ],
        'waec-physics': [
            { prompt: 'The unit of electric current is the:', choices: ['Volt', 'Ohm', 'Ampere', 'Watt'], answer: 'Ampere', explanation: 'Electric current is measured in Amperes (A).', difficulty: 'easy' },
            { prompt: "Newton's first law of motion states that:", choices: ['F = ma', 'A body continues in its state of rest or uniform motion unless acted upon by an external force', 'For every action there is an equal and opposite reaction', 'Acceleration is proportional to force'], answer: 'A body continues in its state of rest or uniform motion unless acted upon by an external force', explanation: "This is Newton's law of inertia.", difficulty: 'easy' },
            { prompt: 'The speed of light in a vacuum is approximately:', choices: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s'], answer: '3 × 10⁸ m/s', explanation: 'The speed of light c ≈ 3 × 10⁸ m/s.', difficulty: 'easy' },
            { prompt: 'Which type of wave requires a medium to propagate?', choices: ['Light waves', 'Radio waves', 'Sound waves', 'X-rays'], answer: 'Sound waves', explanation: 'Sound is a mechanical wave that requires a medium (solid, liquid, or gas).', difficulty: 'easy' },
            { prompt: 'The work done by a force of 10 N moving an object 5 m is:', choices: ['2 J', '15 J', '50 J', '0.5 J'], answer: '50 J', explanation: 'W = F × d = 10 × 5 = 50 J.', difficulty: 'easy' },
            { prompt: 'Ohm\'s law states that V =:', choices: ['I/R', 'IR', 'I + R', 'I − R'], answer: 'IR', explanation: 'V = IR, where V is voltage, I is current, R is resistance.', difficulty: 'easy' },
            { prompt: 'The lens used to correct short-sightedness (myopia) is:', choices: ['Convex lens', 'Concave lens', 'Plane mirror', 'Convex mirror'], answer: 'Concave lens', explanation: 'Concave (diverging) lenses correct myopia by moving the focal point back onto the retina.', difficulty: 'medium' },
            { prompt: 'Which of these is a renewable energy source?', choices: ['Coal', 'Petroleum', 'Solar energy', 'Natural gas'], answer: 'Solar energy', explanation: 'Solar energy is renewable as sunlight is continuously available.', difficulty: 'easy' },
        ],
        'jamb-use-of-english': [
            { prompt: 'Choose the option that correctly fills the gap: She _____ here since morning.', choices: ['is', 'was', 'has been', 'had been'], answer: 'has been', explanation: '"Since" with a reference to a point in time requires the present perfect.', difficulty: 'easy' },
            { prompt: 'The opposite of "verbose" is:', choices: ['talkative', 'concise', 'lengthy', 'wordy'], answer: 'concise', explanation: '"Verbose" means using too many words; its antonym is "concise" (brief and clear).', difficulty: 'medium' },
            { prompt: '"To burn the midnight oil" means:', choices: ['To set a fire at night', 'To work or study late at night', 'To waste fuel', 'To celebrate at night'], answer: 'To work or study late at night', explanation: 'This idiom refers to staying up late to study or work.', difficulty: 'easy' },
            { prompt: 'Select the correct plural of "criterion":', choices: ['criterions', 'criterias', 'criteria', 'criterium'], answer: 'criteria', explanation: '"Criteria" is the correct Latin-origin plural of "criterion".', difficulty: 'medium' },
            { prompt: 'Identify the gerund in: "Swimming is good exercise."', choices: ['is', 'good', 'exercise', 'Swimming'], answer: 'Swimming', explanation: 'A gerund is a verb form ending in -ing used as a noun.', difficulty: 'easy' },
            { prompt: 'The word "ubiquitous" means:', choices: ['rare', 'found everywhere', 'unique', 'ancient'], answer: 'found everywhere', explanation: '"Ubiquitous" means present, appearing, or found everywhere.', difficulty: 'medium' },
            { prompt: 'Choose the sentence with the correct subject-verb agreement:', choices: ['The news are bad.', 'Each of the boys have gone.', 'Neither the boys nor the girl is here.', 'The committee have met.'], answer: 'Neither the boys nor the girl is here.', explanation: 'With "neither...nor", the verb agrees with the subject closest to it (girl → is).', difficulty: 'hard' },
            { prompt: 'A word that modifies a verb is called a/an:', choices: ['Adjective', 'Pronoun', 'Adverb', 'Conjunction'], answer: 'Adverb', explanation: 'Adverbs modify verbs, adjectives, or other adverbs.', difficulty: 'easy' },
        ],
        'jamb-mathematics': [
            { prompt: 'If 2x − 3 = 7, find x.', choices: ['2', '5', '4', '6'], answer: '5', explanation: '2x = 10, x = 5.', difficulty: 'easy' },
            { prompt: 'Simplify log₂8', choices: ['2', '3', '4', '8'], answer: '3', explanation: 'log₂8 = log₂2³ = 3.', difficulty: 'medium' },
            { prompt: 'The gradient of the line y = 3x + 5 is:', choices: ['5', '3', '8', '−3'], answer: '3', explanation: 'In y = mx + c, the gradient is m = 3.', difficulty: 'easy' },
            { prompt: 'Evaluate: ⁵C₂', choices: ['10', '20', '5', '15'], answer: '10', explanation: '⁵C₂ = 5!/(2!3!) = 10.', difficulty: 'medium' },
            { prompt: 'Find the 5th term of the sequence: 3, 7, 11, 15, …', choices: ['17', '19', '20', '18'], answer: '19', explanation: 'AP with first term 3 and common difference 4; T₅ = 3 + 4(4) = 19.', difficulty: 'easy' },
            { prompt: 'The area of a triangle with base 10 cm and height 6 cm is:', choices: ['60 cm²', '30 cm²', '16 cm²', '32 cm²'], answer: '30 cm²', explanation: 'Area = ½ × base × height = ½ × 10 × 6 = 30 cm².', difficulty: 'easy' },
            { prompt: 'If P(A) = 0.4, find P(A\')', choices: ['0.4', '0.6', '0.8', '1.4'], answer: '0.6', explanation: "P(A') = 1 − P(A) = 1 − 0.4 = 0.6.", difficulty: 'easy' },
            { prompt: 'Simplify (3² × 3³) / 3⁴', choices: ['3', '9', '27', '1'], answer: '3', explanation: '3⁽²⁺³⁻⁴⁾ = 3¹ = 3.', difficulty: 'medium' },
        ],
        'neco-english-language': [
            { prompt: 'Select the option with the correct spelling:', choices: ['recieve', 'receive', 'recive', 'receeve'], answer: 'receive', explanation: '"i before e except after c" rule applies.', difficulty: 'easy' },
            { prompt: 'Which of these sentences is in the passive voice?', choices: ['The dog bit the man.', 'The man was bitten by the dog.', 'They chased the thief.', 'She opened the door.'], answer: 'The man was bitten by the dog.', explanation: 'Passive voice: subject receives the action; formed with was/were + past participle.', difficulty: 'easy' },
            { prompt: 'The part of speech of the word "quickly" in "She ran quickly" is:', choices: ['Adjective', 'Preposition', 'Adverb', 'Noun'], answer: 'Adverb', explanation: '"Quickly" modifies the verb "ran" and is therefore an adverb.', difficulty: 'easy' },
        ],
        'kcse-mathematics': [
            { prompt: 'Solve for x: 3(x − 2) = 12', choices: ['2', '6', '4', '8'], answer: '6', explanation: '3x − 6 = 12; 3x = 18; x = 6.', difficulty: 'easy' },
            { prompt: 'Express 72 as a product of its prime factors:', choices: ['2³ × 3²', '2² × 3³', '2 × 36', '8 × 9'], answer: '2³ × 3²', explanation: '72 = 8 × 9 = 2³ × 3².', difficulty: 'medium' },
            { prompt: 'The perimeter of a square with side 7 cm is:', choices: ['14 cm', '28 cm', '49 cm', '21 cm'], answer: '28 cm', explanation: 'Perimeter = 4 × side = 4 × 7 = 28 cm.', difficulty: 'easy' },
            { prompt: 'Find the value of sin 30°:', choices: ['√3/2', '1/2', '1', '0'], answer: '1/2', explanation: 'sin 30° = 1/2 (standard trigonometric value).', difficulty: 'easy' },
            { prompt: 'Simplify: (a²b³)(a³b²)', choices: ['a⁵b⁵', 'a⁶b⁶', 'a⁵b⁶', 'a⁶b⁵'], answer: 'a⁵b⁵', explanation: 'Multiply by adding exponents: a²⁺³ × b³⁺² = a⁵b⁵.', difficulty: 'medium' },
        ],
        'kcse-english': [
            { prompt: 'Choose the correct form of the verb: She _____ to school every day.', choices: ['go', 'goes', 'going', 'gone'], answer: 'goes', explanation: 'With a singular third-person subject (she), add -s to the verb.', difficulty: 'easy' },
            { prompt: '"A blessing in disguise" means:', choices: ['A hidden treasure', 'Something that seems bad but is actually good', 'A disguised person', 'A failed plan'], answer: 'Something that seems bad but is actually good', explanation: 'This idiom refers to something that appears unfortunate at first but turns out to be beneficial.', difficulty: 'easy' },
            { prompt: 'Identify the type of sentence: "Close the door!"', choices: ['Declarative', 'Interrogative', 'Imperative', 'Exclamatory'], answer: 'Imperative', explanation: 'Imperative sentences give commands or instructions.', difficulty: 'easy' },
        ],
        'gce-english-language': [
            { prompt: 'The verb form used after "to" in English is called the:', choices: ['Gerund', 'Infinitive', 'Participle', 'Imperative'], answer: 'Infinitive', explanation: 'The base form of the verb used after "to" is the infinitive.', difficulty: 'easy' },
            { prompt: 'A word opposite in meaning to another word is called a/an:', choices: ['Synonym', 'Antonym', 'Homonym', 'Acronym'], answer: 'Antonym', explanation: 'Antonyms are words with opposite meanings.', difficulty: 'easy' },
            { prompt: 'Select the sentence with a relative clause:', choices: ['She sang beautifully.', 'The book that she borrowed is mine.', 'He came and left.', 'Although tired, she worked.'], answer: 'The book that she borrowed is mine.', explanation: '"that she borrowed" is a relative clause modifying "the book".', difficulty: 'medium' },
        ],
        'gce-mathematics': [
            { prompt: 'Calculate the simple interest on ₦5,000 at 10% per annum for 2 years.', choices: ['₦500', '₦1,000', '₦1,500', '₦2,000'], answer: '₦1,000', explanation: 'SI = PRT/100 = 5000 × 10 × 2 / 100 = ₦1,000.', difficulty: 'easy' },
            { prompt: 'The sum of interior angles of a triangle is:', choices: ['90°', '180°', '270°', '360°'], answer: '180°', explanation: 'The interior angles of any triangle always sum to 180°.', difficulty: 'easy' },
            { prompt: 'Solve: 2/3 + 1/4', choices: ['3/7', '11/12', '7/12', '3/12'], answer: '11/12', explanation: 'LCM of 3 and 4 is 12; 8/12 + 3/12 = 11/12.', difficulty: 'easy' },
        ],
    };

    // For each slug-keyed set of questions, look up the subject and seed questions
    Object.entries(allQuestions).forEach(([slug, qs]) => {
        let subRec;
        try {
            subRec = app.findFirstRecordByFilter('subjects', 'slug = {:s}', { s: slug });
        } catch (_) { return; }

        let examRec;
        try {
            examRec = app.findRecordById('exams', subRec.getString('exam'));
        } catch (_) { return; }

        qs.forEach((q) => {
            // Check if question already exists
            try {
                app.findFirstRecordByFilter('questions', 'exam = {:e} && prompt = {:p}', { e: examRec.id, p: q.prompt });
                return; // already exists
            } catch (_) {}

            const rec = new Record(questionsCol);
            rec.set('exam', examRec.id);
            rec.set('subject', subRec.id);
            rec.set('prompt', q.prompt);
            rec.set('choices', q.choices);
            rec.set('answer', q.answer);
            rec.set('explanation', q.explanation);
            rec.set('difficulty', q.difficulty);
            rec.set('type', 'mcq');
            app.save(rec);
        });
    });

}, (app) => {
    try {
        const profiles = app.findCollectionByNameOrId('profiles');
        profiles.fields.removeByName('leaderboard_opt_out');
        app.save(profiles);
    } catch (_) {}
});
