export const downloadCSV = (data: any[], filename: string, headers?: string[]) => {
    if (!data || !data.length) return;

    // 1. Determine Headers
    const keys = headers || Object.keys(data[0]);

    // 2. Convert Data to CSV Format
    const csvContent = [
        keys.join(";"), // Header Row (using ; for Excel in TR locale usually works better, or ,)
        ...data.map(row => keys.map(k => {
            const val = row[k];
            // Handle strings with separators, quotes, or newlines
            if (typeof val === 'string') {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(";"))
    ].join("\n");

    // 3. Create Blob with BOM for UTF-8 (Critical for Turkish characters)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 4. Trigger Download
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
