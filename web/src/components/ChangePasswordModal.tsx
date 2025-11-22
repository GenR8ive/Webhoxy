import { createSignal, Show } from "solid-js";
import { FiLock, FiAlertCircle, FiEye, FiEyeOff } from "solid-icons/fi";
import { changePassword, user } from "../lib/auth";

interface ChangePasswordModalProps {
  onSuccess?: () => void;
}

function ChangePasswordModal(props: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [showCurrentPassword, setShowCurrentPassword] = createSignal(false);
  const [showNewPassword, setShowNewPassword] = createSignal(false);
  const [showConfirmPassword, setShowConfirmPassword] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!currentPassword()) {
      setError("Current password is required");
      return;
    }

    if (!newPassword()) {
      setError("New password is required");
      return;
    }

    if (newPassword().length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    if (newPassword() !== confirmPassword()) {
      setError("New passwords do not match");
      return;
    }

    if (currentPassword() === newPassword()) {
      setError("New password must be different from current password");
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(currentPassword(), newPassword());
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Call success callback
      if (props.onSuccess) {
        props.onSuccess();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to change password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent closing the modal
  const handleBackdropClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div 
        class="glass-card rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div class="bg-gradient-to-r from-primary-600/80 to-secondary-600/80 px-6 py-4 border-b border-white/10">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <FiLock class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="change-password-title" class="text-xl font-bold text-white">Change Password Required</h2>
              <p class="text-sm text-primary-100">You must change your password to continue</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div class="p-6">
          <form onSubmit={handleSubmit} class="space-y-4">
            {/* Error Message */}
            <Show when={error()}>
              <div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-start space-x-2">
                <FiAlertCircle class="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span class="text-sm">{error()}</span>
              </div>
            </Show>

            {/* Current Password */}
            <div>
              <label for="current-password" class="block text-sm font-medium text-slate-300 mb-2">
                Current Password
              </label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock class="w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input
                  id="current-password"
                  type={showCurrentPassword() ? "text" : "password"}
                  required
                  value={currentPassword()}
                  onInput={(e) => setCurrentPassword(e.currentTarget.value)}
                  class="block w-full pl-10 pr-10 py-3 rounded-lg outline-none input-premium placeholder:text-slate-600"
                  placeholder="Enter current password"
                  disabled={isLoading()}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword())}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showCurrentPassword() ? (
                    <FiEyeOff class="w-5 h-5" />
                  ) : (
                    <FiEye class="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label for="new-password" class="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock class="w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input
                  id="new-password"
                  type={showNewPassword() ? "text" : "password"}
                  required
                  value={newPassword()}
                  onInput={(e) => setNewPassword(e.currentTarget.value)}
                  class="block w-full pl-10 pr-10 py-3 rounded-lg outline-none input-premium placeholder:text-slate-600"
                  placeholder="Enter new password (min 8 characters)"
                  disabled={isLoading()}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword())}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showNewPassword() ? (
                    <FiEyeOff class="w-5 h-5" />
                  ) : (
                    <FiEye class="w-5 h-5" />
                  )}
                </button>
              </div>
              <p class="mt-1 text-xs text-slate-500">Must be at least 8 characters long</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label for="confirm-password" class="block text-sm font-medium text-slate-300 mb-2">
                Confirm New Password
              </label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock class="w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword() ? "text" : "password"}
                  required
                  value={confirmPassword()}
                  onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                  class="block w-full pl-10 pr-10 py-3 rounded-lg outline-none input-premium placeholder:text-slate-600"
                  placeholder="Confirm new password"
                  disabled={isLoading()}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword())}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword() ? (
                    <FiEyeOff class="w-5 h-5" />
                  ) : (
                    <FiEye class="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading()}
              class="w-full btn-primary text-white py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading() ? "Changing Password..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordModal;

