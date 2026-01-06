import { Zap, Beaker, FlaskConical, Dna, Microscope, Radio, Thermometer, Waves } from "lucide-react";

export const subjects = [
    {
        id: 'physics',
        label: 'Physics',
        photo: '/physics.png',
        description: 'Explore electromagnetic induction, wave optics, and classical mechanics.',
        gradeId: ['11', '12'],
        experiments: [
            { id: 'galvanometer', name: 'Conversion of Galvanometer to Voltmeter', path: '/physics', icon: Radio, difficulty: 'Advanced' },
            { id: 'ohm-law', name: "Verification of Ohm's Law", path: '/physics/ohms-law', icon: Zap, difficulty: 'Basic' },
            { id: 'potentiometer', name: 'Comparison of EMF of two Cells', path: '/physics/potentiometer', icon: Zap, difficulty: 'Intermediate' },
            { id: 'meter-bridge', name: 'Resistance of a Wire using Meter Bridge', path: '/physics/meter-bridge', icon: Waves, difficulty: 'Intermediate' }
        ]
    },
    {
        id: 'chemistry',
        label: 'Chemistry',
        photo: 'chemistry.jpg',
        description: 'Analyze molecular structures, buffer solutions, and redox reactions.',
        gradeId: ['10', '11', '12'],
        experiments: [
            { id: 'titration', name: 'Acid-Base Titration Analysis', path: '/titration', icon: FlaskConical, difficulty: 'Intermediate' },
            { id: 'salt-analysis', name: 'Qualitative Analysis of Anions', path: '/chemistry/salt-analysis', icon: Beaker, difficulty: 'Advanced' },
            { id: 'content-based', name: 'Preparation of Lyophilic Sol', path: '/chemistry/sol-prep', icon: FlaskConical, difficulty: 'Basic' }
        ]
    },
    {
        id: 'biology',
        label: 'Biology',
        photo: "biology.jpg",
        description: 'Study cellular respiration, genetics, and plant physiology.',
        gradeId: ['9', '10', '11', '12'],
        experiments: [
            { id: 'mitosis', name: 'Observation of Mitosis in Onion Root Tip', path: '/biology/mitosis', icon: Microscope, difficulty: 'Intermediate' },
            { id: 'flowers', name: 'Study of Flower Reproductive Organs', path: '/biology/flower', icon: Microscope, difficulty: 'Basic' }
        ]
    }
];

export const grades = [
    { id: '8', label: 'Grade 8' },
    { id: '9', label: 'Grade 9' },
    { id: '10', label: 'Grade 10' },
    { id: '11', label: 'Grade 11' },
    { id: '12', label: 'Grade 12' }
];