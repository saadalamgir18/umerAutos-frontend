import { toast } from "react-toastify"

/**
 * Toast utility functions for consistent notifications across the application
 */
export const toastUtils = {
  /**
   * Show a success toast for create operations
   * @param entityName The name of the entity that was created
   */
  successCreate: (entityName: string) => {
    toast.success(`${entityName} has been created successfully.`, {
      icon: "🎉",
    })
  },

  /**
   * Show a success toast for update operations
   * @param entityName The name of the entity that was updated
   */
  successUpdate: (entityName: string) => {
    toast.success(`${entityName} has been updated successfully.`, {
      icon: "✅",
    })
  },

  /**
   * Show a success toast for delete operations
   * @param entityName The name of the entity that was deleted
   */
  successDelete: (entityName: string) => {
    toast.success(`${entityName} has been deleted successfully.`, {
      icon: "🗑️",
    })
  },

  /**
   * Show an error toast for failed operations
   * @param operation The operation that failed (create, update, delete)
   * @param entityName The name of the entity
   * @param error Optional error message
   */
  error: (operation: string, entityName: string, error?: string) => {
    toast.error(error || `Failed to ${operation} ${entityName}. Please try again.`, {
      icon: "❌",
    })
  },

  /**
   * Show a warning toast
   * @param title The title of the warning
   * @param description The description of the warning
   */
  warning: (title: string, description: string) => {
    toast.warning(`${title}: ${description}`, {
      icon: "⚠️",
    })
  },

  /**
   * Show an info toast
   * @param title The title of the info message
   * @param description The description of the info message
   */
  info: (title: string, description: string) => {
    toast.info(`${title}: ${description}`, {
      icon: "ℹ️",
    })
  },

  /**
   * Show a loading toast
   * @param message The loading message
   * @returns Toast ID that can be used to update the toast
   */
  loading: (message: string) => {
    return toast.loading(message, {
      icon: "⏳",
    })
  },

  /**
   * Update a toast (useful for loading -> success/error transitions)
   * @param toastId The ID of the toast to update
   * @param type The new type of toast
   * @param message The new message
   * @param options Additional options
   */
  update: (toastId: string | number, type: "success" | "error" | "warning" | "info", message: string, options = {}) => {
    toast.update(toastId, {
      render: message,
      type,
      isLoading: false,
      autoClose: 2000,
      ...options,
    })
  },
}
