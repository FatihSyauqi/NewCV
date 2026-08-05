"use client";

import { useState, useMemo } from "react";

export default function DataTable({
  data = [],
  columns = [],
  searchPlaceholder = "Search...",
  defaultSortKey = "",
  defaultSortDir = "asc",
  entriesOptions = [10, 25, 50, 100],
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(entriesOptions[0] || 10);

  // Handle Sort Toggle
  const handleSort = (key, sortable) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Helper to extract nested values for search or sorting
  const getNestedValue = (obj, path) => {
    if (!path) return "";
    return path.split(".").reduce((acc, part) => acc && acc[part], obj) || "";
  };

  // Filtered and Sorted Data
  const processedData = useMemo(() => {
    // 1. Search filter
    let result = [...data];
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) => {
        return columns.some((col) => {
          const val = getNestedValue(row, col.key);
          return val.toString().toLowerCase().includes(q);
        });
      });
    }

    // 2. Sort
    if (sortKey) {
      result.sort((a, b) => {
        let valA = getNestedValue(a, sortKey);
        let valB = getNestedValue(b, sortKey);

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, columns, searchQuery, sortKey, sortDir]);

  // Pagination bounds
  const totalEntries = processedData.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (activePage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, activePage, pageSize]);

  const startEntry = totalEntries === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endEntry = Math.min(activePage * pageSize, totalEntries);

  return (
    <div className="w-100">
      {/* Search & Entry Control Bar */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3 p-3 bg-light border-bottom border-light-subtle rounded-top">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Show</span>
          <select
            className="form-select form-select-sm"
            style={{ width: "80px" }}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {entriesOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="text-muted small">entries</span>
        </div>
        <div className="position-relative" style={{ maxWidth: "320px", width: "100%" }}>
          <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control form-control-sm ps-5 py-2 fs-6 rounded-pill"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="table-responsive">
        <table className="table table-custom table-hover mb-0 align-middle">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key, col.sortable)}
                  style={{
                    cursor: col.sortable ? "pointer" : "default",
                    userSelect: "none",
                    ...col.style
                  }}
                  className={col.className}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-muted-emphasis small" style={{ fontSize: "0.75rem" }}>
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <i className="bi bi-sort-up text-primary"></i>
                          ) : (
                            <i className="bi bi-sort-down-alt text-primary"></i>
                          )
                        ) : (
                          <i className="bi bi-arrow-down-up text-muted opacity-50"></i>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={row.id || idx}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.className} style={col.cellStyle}>
                      {col.render ? col.render(row) : getNestedValue(row, col.key)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted">
                  No matching records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 p-3 bg-light border-top border-light-subtle rounded-bottom">
        <div className="small text-muted text-center text-sm-start">
          Showing {startEntry} to {endEntry} of {totalEntries} entries
        </div>

        {totalPages > 1 && (
          <nav aria-label="Table navigation">
            <ul className="pagination pagination-sm mb-0 justify-content-center">
              {/* Previous Button */}
              <li className={`page-item ${activePage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={activePage === 1}
                >
                  Previous
                </button>
              </li>

              {/* Page numbers */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <li
                    key={pageNum}
                    className={`page-item ${activePage === pageNum ? "active" : ""}`}
                  >
                    <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                      {pageNum}
                    </button>
                  </li>
                );
              })}

              {/* Next Button */}
              <li className={`page-item ${activePage === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={activePage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
