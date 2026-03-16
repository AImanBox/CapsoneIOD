/**
 * @file StartRetrainingButton.tsx
 * @description Button to start new retraining job
 * @module components/StartRetrainingButton
 * @category Story10/ModelPerformanceMonitoring
 * 
 * @description
 * Prominent call-to-action button for starting a new retraining job.
 * Triggers modal or wizard modal.
 */

'use client';

interface StartRetrainingButtonProps {
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

/**
 * Start retraining button
 * 
 * @example
 * <StartRetrainingButton 
 *   onClick={() => setShowModal(true)}
 * />
 */
export default function StartRetrainingButton({
  onClick,
  disabled = false,
  size = 'md',
  variant = 'primary',
}: StartRetrainingButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400',
    secondary:
      'bg-white border-2 border-teal-600 text-teal-600 hover:bg-teal-50 disabled:border-gray-400 disabled:text-gray-400',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        font-semibold rounded-lg transition-all duration-200
        flex items-center gap-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
      `}
    >
      <span>🔄</span>
      <span>Start Retraining</span>
    </button>
  );
}
