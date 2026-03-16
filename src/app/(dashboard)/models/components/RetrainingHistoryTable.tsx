/**
 * @file RetrainingHistoryTable.tsx
 * @description Retraining job history table with pagination
 * @module components/RetrainingHistoryTable
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Full table showing retraining job history with sorting,
 * filtering, and pagination.
 */

'use client';

import { useState } from 'react';
import RetrainingJobRow from './RetrainingJobRow';
import { formatDate } from '../utils/formatters';
import type { RetrainingJob } from '../types/models.types';

interface RetrainingHistoryTableProps {
  jobs: RetrainingJob[];
  isLoading?: boolean;
  onViewDetails?: (job: RetrainingJob) => void;
  onRetry?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
}

/**
 * Retraining history table with pagination
 * 
 * @example
 * <RetrainingHistoryTable 
 *   jobs={jobs}
 *   onViewDetails={handleViewDetails}
 */
export default function RetrainingHistoryTable({
  jobs,
  isLoading,
  onViewDetails,
  onRetry,
  onCancel,
}: RetrainingHistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const itemsPerPage = 10;

  // Filter jobs
  const filteredJobs = statusFilter === 'all' 
    ? jobs 
    : jobs.filter(j => j.status === statusFilter);

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.triggeredBy.triggeredAt).getTime() - 
             new Date(a.triggeredBy.triggeredAt).getTime();
    }
    const statusOrder = { queued: 0, training: 1, validating: 2, deployed: 3, failed: 4, rolled_back: 5 };
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
  });

  // Paginate
  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = sortedJobs.slice(startIdx, startIdx + itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(p => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(p => Math.min(totalPages, p + 1));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header with controls */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Retraining History</h3>
          <span className="text-sm text-gray-600">{filteredJobs.length} jobs</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="training">Training</option>
              <option value="validating">Validating</option>
              <option value="deployed">Deployed</option>
              <option value="failed">Failed</option>
              <option value="rolled_back">Rolled Back</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'status')}
              className="px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Most Recent</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin">
            <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
          </div>
          <p className="text-gray-600 mt-2">Loading retraining history...</p>
        </div>
      ) : paginatedJobs.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-600 mb-2">No retraining jobs found</p>
          {statusFilter !== 'all' && (
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Head */}
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-bold uppercase text-gray-600">Job ID</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-bold uppercase text-gray-600">Status</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-bold uppercase text-gray-600">ROC-AUC</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-bold uppercase text-gray-600">Triggered</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-bold uppercase text-gray-600">Duration</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-bold uppercase text-gray-600">Result</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-bold uppercase text-gray-600">Actions</span>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {paginatedJobs.map((job) => (
                  <RetrainingJobRow
                    key={job.jobId}
                    job={job}
                    onViewDetails={onViewDetails}
                    onRetry={onRetry}
                    onCancel={onCancel}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, sortedJobs.length)} of{' '}
                {sortedJobs.length} jobs
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="px-2 text-gray-600">...</span>}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
