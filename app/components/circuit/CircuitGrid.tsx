import React from 'react';

export default function CircuitGrid() {
    return (
        <>
            {/* Engineering Grid - Major Lines */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            {/* Engineering Grid - Minor Lines */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#e2e8f040_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f040_1px,transparent_1px)] bg-[size:8px_8px]"></div>
        </>
    );
}
