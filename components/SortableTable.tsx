import React, { useState, useMemo, ReactElement, isValidElement, ReactNode } from 'react';

// Helper to recursively get text content from a React node
const getNodeText = (node: ReactNode): string => {
    if (node === null || node === undefined) return '';
    if (['string', 'number'].includes(typeof node)) return node.toString();
    if (Array.isArray(node)) return node.map(getNodeText).join('');
    // FIX: Use isValidElement for robust checking of React elements.
    if (isValidElement(node) && node.props.children) {
        return getNodeText(node.props.children);
    }
    return '';
};


// Helper for smart comparison (handles numbers and strings)
const compareValues = (a: string, b: string, isAsc: boolean) => {
    const numA = parseFloat(a.trim().replace(/,/g, ''));
    const numB = parseFloat(b.trim().replace(/,/g, ''));

    let comparison = 0;
    if (!isNaN(numA) && !isNaN(numB)) {
        comparison = numA > numB ? 1 : -1;
    } else {
        comparison = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    }

    return isAsc ? comparison : -comparison;
};

// Sort indicator component for visual feedback
const SortIndicator: React.FC<{ direction: 'asc' | 'desc' | null }> = ({ direction }) => {
    if (direction === 'asc') return <span className="ml-2 text-indigo-600">▲</span>;
    if (direction === 'desc') return <span className="ml-2 text-indigo-600">▼</span>;
    // The "unsorted" indicator is subtle and appears on hover within the TH group
    return <span className="ml-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">↕</span>;
};

const SortableTable: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);

    // FIX: Use isValidElement to safely find table head and body, preventing unsafe casts.
    const tableHead = React.Children.toArray(children).find(child => isValidElement(child) && child.type === 'thead');
    const tableBody = React.Children.toArray(children).find(child => isValidElement(child) && child.type === 'tbody');

    if (!tableHead || !tableBody || !isValidElement(tableHead) || !isValidElement(tableBody)) {
        return <table>{children}</table>;
    }

    const headerRow = React.Children.toArray(tableHead.props.children)[0];
    const originalThNodes = isValidElement(headerRow) ? React.Children.toArray(headerRow.props.children) : [];

    const originalRows = useMemo(() => {
        const rows = React.Children.toArray(tableBody.props.children);
        return rows.map((row: ReactNode) => {
            if (!isValidElement(row)) return { originalNode: row, cells: [] };
            const cells = React.Children.toArray(row.props.children).map(cell => getNodeText(cell));
            return { originalNode: row, cells };
        });
    }, [tableBody.props.children]);

    const sortedRows = useMemo(() => {
        if (sortConfig === null) {
            return originalRows;
        }
        return [...originalRows].sort((a, b) => {
            const valA = a.cells[sortConfig.key] || '';
            const valB = b.cells[sortConfig.key] || '';
            return compareValues(valA, valB, sortConfig.direction === 'asc');
        });
    }, [originalRows, sortConfig]);

    const requestSort = (key: number) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <table>
            <thead>
                <tr>
                    {originalThNodes.map((thNode, index) => (
                        <th 
                            key={index} 
                            onClick={() => requestSort(index)} 
                            className="cursor-pointer select-none group"
                            aria-sort={sortConfig?.key === index ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                            <div className="flex items-center justify-between">
                                {/* FIX: Safely access children of thNode using a type guard. */}
                                {isValidElement(thNode) ? (thNode as ReactElement).props.children : thNode}
                                <SortIndicator direction={sortConfig?.key === index ? sortConfig.direction : null} />
                            </div>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {sortedRows.map((row, index) => (
                    <React.Fragment key={index}>
                      {row.originalNode}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
    );
};

export default SortableTable;