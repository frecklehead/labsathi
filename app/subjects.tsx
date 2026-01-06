import { Zap } from "lucide-react"; 
import { FlaskConical, Beaker } from "lucide-react";
 
 export const subjects = [
        {
            id: 'physics',
            label: 'Physics',
            icon: Zap,
            description: 'Explore the laws of nature, from electricity to mechanics.',
            color: 'from-blue-600 to-cyan-500',
            glow: 'shadow-blue-500/20',
            experiments: [
                { id: 'galvanometer', name: 'Conversion of Galvanometer to Voltmeter', path: '/physics', icon: Zap }
            ]
        },
        {
            id: 'chemistry',
            label: 'Chemistry',
            icon: Beaker,
            description: 'Dive into chemical reactions, titrations, and molecular structures.',
            color: 'from-purple-600 to-pink-500',
            glow: 'shadow-purple-500/20',
            experiments: [
                { id: 'titration', name: 'Acid-Base Titration', path: '/titration', icon: FlaskConical }
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