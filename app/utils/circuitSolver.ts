import { PhysicsItem, Wire } from '../types/circuit.types';
import { getTerminals, getAllTerminals } from './circuitHelpers';

export function solveCircuitNodal(items: PhysicsItem[], wires: Wire[]): PhysicsItem[] {
    if (items.length === 0) return items;

    const allTerminals = getAllTerminals(items);
    const terminalToNodeMap = new Map<string, number>();
    let nodeCount = 0;

    allTerminals.forEach(t => {
        if (!terminalToNodeMap.has(t.id)) {
            const cluster = new Set<string>([t.id]);
            const stack = [t.id];
            while (stack.length > 0) {
                const currentId = stack.pop()!;
                wires.forEach(w => {
                    const fromId = `${w.from.itemId}-${w.from.terminal}`;
                    const toId = `${w.to.itemId}-${w.to.terminal}`;
                    if (fromId === currentId && !cluster.has(toId)) {
                        cluster.add(toId);
                        stack.push(toId);
                    } else if (toId === currentId && !cluster.has(fromId)) {
                        cluster.add(fromId);
                        stack.push(fromId);
                    }
                });
            }
            cluster.forEach(id => terminalToNodeMap.set(id, nodeCount));
            nodeCount++;
        }
    });

    if (nodeCount < 2) return items;

    const voltageSources = items.filter(item => item.type === 'battery');
    const m = voltageSources.length;
    const matrixSize = nodeCount + m;

    const matrix = Array.from({ length: matrixSize }, () => new Float64Array(matrixSize).fill(0));
    const bVector = new Float64Array(matrixSize).fill(0);

    items.forEach(item => {
        const terminals = getTerminals(item);
        const nodes = terminals.map((t) => terminalToNodeMap.get(t.id)!);

        if (item.type === "rheostat") {
            const nA = terminalToNodeMap.get(`${item.id}-A`);
            const nB = terminalToNodeMap.get(`${item.id}-B`);
            const nC = terminalToNodeMap.get(`${item.id}-C`);

            const rTotal = item.props.maxResistance || 100;
            const rVal = item.props.resistance || 0.1;

            if (nA !== undefined && nC !== undefined) {
                const g = 1 / Math.max(rVal, 0.001);
                matrix[nA][nA] += g;
                matrix[nC][nC] += g;
                matrix[nA][nC] -= g;
                matrix[nC][nA] -= g;
            }
            if (nC !== undefined && nB !== undefined) {
                const g = 1 / Math.max(rTotal - rVal, 0.001);
                matrix[nC][nC] += g;
                matrix[nB][nB] += g;
                matrix[nC][nB] -= g;
                matrix[nB][nC] -= g;
            }
        } else if (nodes.length >= 2) {
            let r = 0;
            if (item.type === "resistor") r = item.props.resistance || 0.1;
            else if (item.type === "resistance_box") r = item.props.resistance || 0.1;
            else if (item.type === "galvanometer") r = item.props.internalResistance || 100;
            else if (item.type === "ammeter") r = item.props.internalResistance || 0.01;
            else if (item.type === "voltmeter") r = item.props.internalResistance || 1000000;

            if (r > 0) {
                const n1 = nodes[0];
                const n2 = nodes[1];
                const g = 1 / r;
                matrix[n1][n1] += g;
                matrix[n2][n2] += g;
                matrix[n1][n2] -= g;
                matrix[n2][n1] -= g;
            }
        }
    });

    for (let i = 0; i < nodeCount; i++) {
        matrix[i][i] += 1e-12;
    }

    voltageSources.forEach((source, idx) => {
        const nPos = terminalToNodeMap.get(`${source.id}-positive`)!;
        const nNeg = terminalToNodeMap.get(`${source.id}-negative`)!;
        const v = source.props.voltage || 0;

        const row = nodeCount + idx;
        matrix[row][nPos] = 1;
        matrix[row][nNeg] = -1;
        matrix[nPos][row] = 1;
        matrix[nNeg][row] = -1;
        bVector[row] = v;
    });

    matrix[0].fill(0);
    matrix[0][0] = 1;
    bVector[0] = 0;

    const solve = (A: number[][], B: number[]) => {
        const n = B.length;
        for (let i = 0; i < n; i++) {
            let max = i;
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(A[j][i]) > Math.abs(A[max][i])) max = j;
            }
            [A[i], A[max]] = [A[max], A[i]];
            [B[i], B[max]] = [B[max], B[i]];

            if (Math.abs(A[i][i]) < 1e-12) continue;

            for (let j = i + 1; j < n; j++) {
                const factor = A[j][i] / A[i][i];
                B[j] -= factor * B[i];
                for (let k = i; k < n; k++) A[j][k] -= factor * A[i][k];
            }
        }

        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) sum += A[i][j] * x[j];
            x[i] = (B[i] - sum) / A[i][i];
        }
        return x;
    };

    try {
        const sol = solve(matrix.map(row => Array.from(row)), Array.from(bVector));

        return items.map(item => {
            const terminals = getTerminals(item);
            const nodes = terminals.map(t => terminalToNodeMap.get(t.id)!);
            const v1 = sol[nodes[0]] || 0;
            const v2 = sol[nodes[1]] || 0;
            const voltage = Math.abs(v1 - v2);

            if (item.type === 'galvanometer') {
                const current = (v1 - v2) / (item.props.internalResistance || 100);
                return { ...item, props: { ...item.props, current: current * 1000 } };
            }
            if (item.type === 'ammeter') {
                const current = (v1 - v2) / (item.props.internalResistance || 0.01);
                return { ...item, props: { ...item.props, current: Math.abs(current) } };
            }
            if (item.type === 'voltmeter') {
                return { ...item, props: { ...item.props, voltage } };
            }
            return item;
        });
    } catch (e) {
        console.error("Solver Error", e);
        return items;
    }
}
