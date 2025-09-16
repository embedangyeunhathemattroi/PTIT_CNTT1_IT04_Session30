import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Check, Edit } from "lucide-react";

type Task = {
  id: number;
  task: string;
  completed: boolean;
};

export default function TodoLis() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<"all" | "completed" | "active">("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAlert, setShowAlert] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{
    id?: number, 
    type: 'single' | 'completed' | 'all',
    taskName?: string
  } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const newTaskRef = useRef<HTMLInputElement>(null);

  // API functions với loading states
  const api = {
    async getTasks() {
      try {
        setApiLoading(true);
        const response = await fetch("http://localhost:3000/todolist");
        // Simulate network delay để thấy loading effect
        await new Promise(resolve => setTimeout(resolve, 800));
        return await response.json();
      } catch (error) {
        console.error("API Error:", error);
        // Fallback to hardcoded data if API fails
        return [
          { id: 1, task: "Quet nha", completed: false },
          { id: 2, task: "giat quan ao", completed: true },
          { id: 3, task: "nau com", completed: false },
          { id: 4, task: "nấu", completed: false }
        ];
      } finally {
        setApiLoading(false);
      }
    },
    
    async addTask(task: Task) {
      try {
        setApiLoading(true);
        const response = await fetch("http://localhost:3000/todolist", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task)
        });
        await new Promise(resolve => setTimeout(resolve, 300));
        return await response.json();
      } catch (error) {
        console.error("API Error:", error);
        return task;
      } finally {
        setApiLoading(false);
      }
    },
    
    async updateTask(id: number, updatedTask: Task) {
      try {
        setApiLoading(true);
        const response = await fetch(`http://localhost:3000/todolist/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedTask)
        });
        await new Promise(resolve => setTimeout(resolve, 300));
        return await response.json();
      } catch (error) {
        console.error("API Error:", error);
        return updatedTask;
      } finally {
        setApiLoading(false);
      }
    },
    
    async deleteTask(id: number) {
      try {
        setApiLoading(true);
        const response = await fetch(`http://localhost:3000/todolist/${id}`, {
          method: 'DELETE'
        });
        await new Promise(resolve => setTimeout(resolve, 300));
        return await response.json();
      } catch (error) {
        console.error("API Error:", error);
        return true;
      } finally {
        setApiLoading(false);
      }
    }
  };

  // Show alert function
  const showAlertMessage = (message: string, type: 'success' | 'error' | 'warning') => {
    setShowAlert({message, type});
    setTimeout(() => setShowAlert(null), 3000);
  };

  // Fetch dữ liệu từ API
  async function getAllTasks() {
    try {
      const listTask = await api.getTasks();
      const normalizedTasks = listTask.map((t: any) => ({
        id: t.id,
        task: t.task || t.name,
        completed: t.completed === true || t.completed === "hoan thanh"
      }));
      setTasks(normalizedTasks);
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      showAlertMessage("Lỗi khi tải dữ liệu", "error");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  useEffect(() => {
    getAllTasks();
  }, []);

  // Validate tên công việc
  const isValidTask = (name: string, idToExclude?: number) => {
    if (!name.trim()) {
      showAlertMessage("Tên công việc không được để trống", "error");
      return false;
    }
    const exists = tasks.some(
      (t) => t.task.toLowerCase() === name.trim().toLowerCase() && t.id !== idToExclude
    );
    if (exists) {
      showAlertMessage("Tên công việc không được trùng", "error");
      return false;
    }
    return true;
  };

  // Thêm công việc
  const addTask = async () => {
    if (!isValidTask(newTask) || apiLoading) return;
    const task: Task = { id: Date.now(), task: newTask.trim(), completed: false };
    try {
      const newTodo = await api.addTask(task);
      setTasks([...tasks, newTodo]);
      setNewTask("");
      newTaskRef.current?.focus();
      showAlertMessage("Thêm công việc thành công!", "success");
    } catch (error) {
      showAlertMessage("Lỗi khi thêm công việc", "error");
    }
  };

  // Toggle hoàn thành
  const toggleTask = async (id: number) => {
    if (apiLoading) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const updatedTask = { ...task, completed: !task.completed };
    try {
      await api.updateTask(id, updatedTask);
      setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));

      const allCompleted = tasks.every((t) => (t.id === id ? updatedTask.completed : t.completed));
      if (allCompleted && updatedTask.completed) {
        showAlertMessage("Hoàn thành tất cả công việc! 🎉", "success");
      }
    } catch (error) {
      showAlertMessage("Lỗi khi cập nhật công việc", "error");
    }
  };

  // Xóa công việc
  const deleteTask = async (id: number) => {
    try {
      await api.deleteTask(id);
      setTasks(tasks.filter((t) => t.id !== id));
      setShowDeleteModal(null);
      showAlertMessage("Đã xóa công việc!", "success");
    } catch (error) {
      showAlertMessage("Lỗi khi xóa công việc", "error");
    }
  };

  // Xóa tất cả công việc hoàn thành
  const deleteCompleted = async () => {
    const completedTasks = tasks.filter((t) => t.completed);
    if (completedTasks.length === 0) return;

    try {
      for (let t of completedTasks) {
        await api.deleteTask(t.id);
      }
      setTasks(tasks.filter((t) => !t.completed));
      setShowDeleteModal(null);
      showAlertMessage("Đã xóa tất cả công việc hoàn thành!", "success");
    } catch (error) {
      showAlertMessage("Lỗi khi xóa công việc", "error");
    }
  };

  // Xóa tất cả công việc
  const deleteAll = async () => {
    try {
      for (let t of tasks) {
        await api.deleteTask(t.id);
      }
      setTasks([]);
      setShowDeleteModal(null);
      showAlertMessage("Đã xóa tất cả công việc!", "success");
    } catch (error) {
      showAlertMessage("Lỗi khi xóa công việc", "error");
    }
  };

  // Mở modal sửa
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTimeout(() => editInputRef.current?.focus(), 100);
  };

  // Cập nhật công việc
  const updateTask = async () => {
    if (!editingTask || apiLoading) return;
    if (!isValidTask(editingTask.task, editingTask.id)) return;
    try {
      await api.updateTask(editingTask.id, editingTask);
      setTasks(tasks.map((t) => (t.id === editingTask.id ? editingTask : t)));
      setEditingTask(null);
      showAlertMessage("Cập nhật công việc thành công!", "success");
    } catch (error) {
      showAlertMessage("Lỗi khi cập nhật công việc", "error");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "active") return !task.completed;
    return true;
  });

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-bold text-gray-700">Đang tải công việc...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white shadow-2xl rounded-xl p-6 w-full max-w-md relative">
        {/* Loading Overlay */}
        {apiLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Đang xử lý...</p>
            </div>
          </div>
        )}
        
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Quản lý công việc</h2>

        {/* Alert */}
        {showAlert && (
          <div className={`mb-4 p-3 rounded-lg border-l-4 ${
            showAlert.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
            showAlert.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
            'bg-yellow-50 border-yellow-500 text-yellow-700'
          }`}>
            {showAlert.message}
          </div>
        )}

        {/* Input thêm công việc */}
        <div className="mb-6">
          <input
            type="text"
            ref={newTaskRef}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, addTask)}
            placeholder="Nhập tên công việc"
            className="border border-gray-300 rounded-lg w-full px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          />
          <button
            onClick={addTask}
            disabled={apiLoading || !newTask.trim()}
            className={`px-4 py-3 rounded-lg w-full flex items-center justify-center gap-2 transition duration-200 font-medium ${
              apiLoading || !newTask.trim() 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {apiLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang thêm...
              </>
            ) : (
              <>
                <Plus size={18} /> Thêm công việc
              </>
            )}
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-lg transition duration-200 ${
              filter === "all" ? "bg-blue-600 text-white shadow-md" : "border border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setFilter("all")}
          >
            Tất cả ({tasks.length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition duration-200 ${
              filter === "completed" ? "bg-blue-600 text-white shadow-md" : "border border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setFilter("completed")}
          >
            Hoàn thành ({tasks.filter(t => t.completed).length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition duration-200 ${
              filter === "active" ? "bg-blue-600 text-white shadow-md" : "border border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setFilter("active")}
          >
            Đang thực hiện ({tasks.filter(t => !t.completed).length})
          </button>
        </div>

        {/* Danh sách công việc */}
        <div className="mb-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>Không có công việc nào</p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-80 overflow-y-auto">
              {filteredTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 hover:shadow-sm transition duration-200"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      disabled={apiLoading}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className={`${task.completed ? "line-through text-gray-500" : "text-gray-800"} transition duration-200`}>
                      {task.task}
                    </span>
                    {apiLoading && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-amber-500 hover:text-amber-600 p-1 hover:bg-amber-50 rounded transition duration-200"
                      onClick={() => openEditModal(task)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        const taskToDelete = tasks.find(t => t.id === task.id);
                        setShowDeleteModal({
                          id: task.id, 
                          type: 'single',
                          taskName: taskToDelete?.task
                        });
                      }}
                      className="text-red-500 hover:text-red-600 p-1 hover:bg-red-50 rounded transition duration-200"
                      disabled={apiLoading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Nút xóa */}
        {tasks.length > 0 && (
          <div className="flex flex-col gap-2">
            {tasks.some(t => t.completed) && (
              <button
                onClick={() => setShowDeleteModal({type: 'completed'})}
                disabled={apiLoading}
                className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition duration-200 ${
                  apiLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
              >
                <Check size={16} /> Xóa công việc hoàn thành
              </button>
            )}
            <button
              onClick={() => setShowDeleteModal({type: 'all'})}
              disabled={apiLoading}
              className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition duration-200 ${
                apiLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <Trash2 size={16} /> Xóa tất cả công việc
            </button>
          </div>
        )}

        {/* Modal xóa */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96 mx-4">
              <h3 className="text-lg font-bold mb-2 text-gray-800">
                {showDeleteModal.type === 'single' ? 'Xác nhận xóa công việc' :
                 showDeleteModal.type === 'completed' ? 'Xóa công việc hoàn thành' :
                 'Xóa tất cả công việc'}
              </h3>
              
              {showDeleteModal.type === 'single' && showDeleteModal.taskName && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Công việc sẽ bị xóa:</p>
                  <p className="font-semibold text-red-700">"{showDeleteModal.taskName}"</p>
                </div>
              )}
              
              <p className="text-gray-600 mb-6">
                {showDeleteModal.type === 'single' ? 'Bạn có chắc muốn xóa công việc này không? Hành động này không thể hoàn tác.' :
                 showDeleteModal.type === 'completed' ? `Bạn có chắc muốn xóa tất cả ${tasks.filter(t => t.completed).length} công việc hoàn thành?` :
                 `Bạn có chắc muốn xóa tất cả ${tasks.length} công việc? Hành động này không thể hoàn tác.`}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                  onClick={() => setShowDeleteModal(null)}
                  disabled={apiLoading}
                >
                  Hủy
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2 ${
                    apiLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                  disabled={apiLoading}
                  onClick={() => {
                    if (showDeleteModal.type === 'single' && showDeleteModal.id) {
                      deleteTask(showDeleteModal.id);
                    } else if (showDeleteModal.type === 'completed') {
                      deleteCompleted();
                    } else if (showDeleteModal.type === 'all') {
                      deleteAll();
                    }
                  }}
                >
                  {apiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Xóa
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal sửa */}
        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-80 mx-4">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Cập nhật công việc</h3>
              <input
                ref={editInputRef}
                type="text"
                value={editingTask.task}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, task: e.target.value })
                }
                onKeyPress={(e) => handleKeyPress(e, updateTask)}
                disabled={apiLoading}
                className="border border-gray-300 rounded-lg w-full px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:opacity-50"
              />
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                  onClick={() => setEditingTask(null)}
                  disabled={apiLoading}
                >
                  Hủy
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2 ${
                    apiLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  onClick={updateTask}
                  disabled={apiLoading}
                >
                  {apiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập nhật'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}