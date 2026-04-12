// Pagination.jsx
import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages === 0) return null;

  const maxVisible = 5; // max 5 pages visible at a time
  let startPage = Math.max(1, Math.min(page - 2, totalPages - maxVisible + 1));
  const endPage = Math.min(startPage + maxVisible - 1, totalPages);

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav>
      <ul className="pagination justify-content-center">

        {/* Previous */}
        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => onPageChange(page - 1)}>
            <FaChevronLeft />
          </button>
        </li>

        {/* Page Numbers */}
        {pages.map((p) => (
          <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
            <button className="page-link" onClick={() => onPageChange(p)}>
              {p}
            </button>
          </li>
        ))}

        {/* Next */}
        <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => onPageChange(page + 1)}>
            <FaChevronRight />
          </button>
        </li>

      </ul>
    </nav>
  );
};

export default Pagination;