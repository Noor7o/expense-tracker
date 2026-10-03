// Expense Tracker - frontend logic

// PHASE 2
// Your backend from Phase 1 is already running, with real expenses in the
// database (from schema.sql). Build this page directly against it with
// fetch and async/await - there is no in-memory or localStorage stage
// this time, and no sample data file.
//
// A possible structure (change it if you have a better idea):
//   - async function getExpenses()          fetch(API_URL), return the JSON
//   - async function addExpense(data)       fetch(API_URL, { method: "POST", ... })
//   - async function updateExpense(id,data) fetch(API_URL + "/" + id, { method: "PUT", ... })
//   - async function deleteExpense(id)      fetch(API_URL + "/" + id, { method: "DELETE" })
//   - async function refresh()              get the list, then call renderTable and renderSummary
//   - renderTable(list)                     build the table rows from the array the API returned
//   - renderSummary(list)                   update the summary cards
//   - applyFilter()                         re-render with the list filtered by category
//
// Don't forget:
//   - Show a Bootstrap spinner while a request is in flight.
//   - Wrap every fetch call in try/catch, and show a Bootstrap alert on failure.
//   - After add, edit, or delete, call refresh() so the page always shows
//     what the server actually saved - never update the table by hand.
//   - The API is at http://localhost:3000/api/expenses (see the Roadmap).


const API_URL = "http://localhost:3000/api/expenses";

const CHART_COLORS = ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1", "#fd7e14"];

// All expenses from the server. The table shows a filtered and sorted copy of this list.
let allExpenses = [];
let editingId = null;
let sortField = "date";
let sortDirection = "desc";
let categoryChart = null;

// Stops text from the database from being read as HTML
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showAlert(message, type = "danger") {
  document.querySelector("#alert-container").innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

function showSpinner(show) {
  document.querySelector("#spinner").classList.toggle("d-none", !show);
}

async function getExpenses() {
  showSpinner(true);
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch expenses");
    return await response.json();
  } catch (error) {
    console.error(error);
    showAlert("Error loading expenses from server.");
    return [];
  } finally {
    showSpinner(false);
  }
}

async function deleteExpense(id) {
  showSpinner(true);
  try {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete expense");
    if (editingId === id) resetForm();
    await refresh();
  } catch (error) {
    console.error(error);
    showAlert("Error deleting expense.");
  } finally {
    showSpinner(false);
  }
}

function editExpense(id) {
  const expense = allExpenses.find(item => item.id === id);
  if (!expense) return;

  editingId = id;
  document.querySelector("#title").value = expense.title;
  document.querySelector("#amount").value = expense.amount;
  document.querySelector("#category").value = expense.category;
  document.querySelector("#date").value = expense.date;

  document.querySelector("#form-title").textContent = "Edit expense";
  document.querySelector("#submit-btn").textContent = "Update expense";
  document.querySelector("#title").scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetForm() {
  editingId = null;
  const form = document.querySelector("form");
  form.reset();
  form.querySelectorAll(".is-invalid").forEach(input => input.classList.remove("is-invalid"));
  document.querySelector("#form-title").textContent = "Add expense";
  document.querySelector("#submit-btn").textContent = "Add expense";
}

// Applies the category filter, the title search and the sorting
function getVisibleExpenses() {
  const category = document.querySelector("#filter-category").value;
  const search = document.querySelector("#search-input").value.trim().toLowerCase();

  const list = allExpenses.filter(expense => {
    const matchesCategory = category === "All" || expense.category === category;
    const matchesSearch = expense.title.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  list.sort((a, b) => {
    let result;
    if (sortField === "amount") {
      result = Number(a.amount) - Number(b.amount);
    } else {
      result = String(a[sortField]).localeCompare(String(b[sortField]));
    }
    return sortDirection === "asc" ? result : -result;
  });

  return list;
}

function handleSort(field) {
  if (sortField === field) {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortField = field;
    sortDirection = "asc";
  }
  applyFilter();
}

function updateSortIndicators() {
  document.querySelectorAll("th[data-sort]").forEach(th => {
    const isActive = th.dataset.sort === sortField;
    const arrow = isActive ? (sortDirection === "asc" ? " ▲" : " ▼") : "";
    th.textContent = th.dataset.label + arrow;
  });
}

function renderTable(expenses) {
  const tableBody = document.querySelector("#expense-table-body");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (expenses.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No expenses found.</td></tr>`;
    return;
  }

  expenses.forEach(expense => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(expense.title)}</td>
      <td>$${Number(expense.amount).toFixed(2)}</td>
      <td>${escapeHtml(expense.category)}</td>
      <td>${escapeHtml(expense.date)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-2" onclick="editExpense(${expense.id})">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${expense.id})">Delete</button>
      </td>`;
    tableBody.appendChild(row);
  });
}

function renderSummary(expenses) {
  const totalAmountEl = document.querySelector("#total-amount");
  const totalCountEl = document.querySelector("#total-count");
  const highestExpenseEl = document.querySelector("#highest-expense");

  if (!expenses || expenses.length === 0) {
    totalAmountEl.textContent = "$0.00";
    totalCountEl.textContent = "0";
    highestExpenseEl.textContent = "$0.00";
    return;
  }

  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const highest = Math.max(...expenses.map(item => Number(item.amount)));

  totalAmountEl.textContent = `$${total.toFixed(2)}`;
  totalCountEl.textContent = expenses.length;
  highestExpenseEl.textContent = `$${highest.toFixed(2)}`;
}

function getChartTextColor() {
  const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";
  return isDark ? "#dee2e6" : "#495057";
}

// Doughnut chart with the total amount of each category
function renderChart(expenses) {
  const canvas = document.querySelector("#category-chart");
  if (!canvas || typeof Chart === "undefined") return;

  const totals = {};
  expenses.forEach(expense => {
    totals[expense.category] = (totals[expense.category] || 0) + Number(expense.amount);
  });

  const labels = Object.keys(totals);
  const data = Object.values(totals).map(value => Number(value.toFixed(2)));

  if (categoryChart) {
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = data;
    categoryChart.update();
    return;
  }

  categoryChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: CHART_COLORS, borderWidth: 0 }]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: getChartTextColor() }
        }
      }
    }
  });
}

function applyFilter() {
  renderTable(getVisibleExpenses());
  updateSortIndicators();
}

async function refresh() {
  allExpenses = await getExpenses();
  renderSummary(allExpenses);
  renderChart(allExpenses);
  applyFilter();
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const titleInput = document.querySelector("#title");
  const amountInput = document.querySelector("#amount");
  const categoryInput = document.querySelector("#category");
  const dateInput = document.querySelector("#date");

  const title = titleInput.value.trim();
  const amount = amountInput.value.trim();
  const category = categoryInput.value;
  const date = dateInput.value;

  let isValid = true;

  if (!title) {
    titleInput.classList.add("is-invalid");
    isValid = false;
  } else {
    titleInput.classList.remove("is-invalid");
  }

  if (!amount || parseFloat(amount) <= 0) {
    amountInput.classList.add("is-invalid");
    isValid = false;
  } else {
    amountInput.classList.remove("is-invalid");
  }

  if (!category) {
    categoryInput.classList.add("is-invalid");
    isValid = false;
  } else {
    categoryInput.classList.remove("is-invalid");
  }

  if (!date) {
    dateInput.classList.add("is-invalid");
    isValid = false;
  } else {
    dateInput.classList.remove("is-invalid");
  }

  if (!isValid) return;

  const expenseData = {
    title,
    amount: parseFloat(amount),
    category,
    date
  };

  // The same form is used for adding (POST) and editing (PUT)
  const isEditing = editingId !== null;
  const url = isEditing ? `${API_URL}/${editingId}` : API_URL;
  const method = isEditing ? "PUT" : "POST";

  showSpinner(true);
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData)
    });

    if (!response.ok) throw new Error("Failed to save expense");

    resetForm();
    await refresh();
  } catch (error) {
    console.error(error);
    showAlert(isEditing ? "Error updating expense." : "Error saving expense to server.");
  } finally {
    showSpinner(false);
  }
}

// Wraps each value in quotes so commas and quotes inside titles do not break the CSV
function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

// Exports the expenses that are currently shown in the table
function exportCsv() {
  const list = getVisibleExpenses();
  if (list.length === 0) {
    showAlert("There are no expenses to export.", "warning");
    return;
  }

  const header = ["Title", "Amount", "Category", "Date"];
  const rows = list.map(expense => [
    expense.title,
    Number(expense.amount).toFixed(2),
    expense.category,
    expense.date
  ]);

  const csv = [header, ...rows].map(row => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "expenses.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  document.querySelector("#theme-toggle").textContent = theme === "dark" ? "Light mode" : "Dark mode";
  localStorage.setItem("theme", theme);

  if (categoryChart) {
    categoryChart.options.plugins.legend.labels.color = getChartTextColor();
    categoryChart.update();
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-bs-theme");
  applyTheme(current === "dark" ? "light" : "dark");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("form").addEventListener("submit", handleFormSubmit);
  document.querySelector("#filter-category").addEventListener("change", applyFilter);
  document.querySelector("#search-input").addEventListener("input", applyFilter);
  document.querySelector("#export-csv").addEventListener("click", exportCsv);
  document.querySelector("#theme-toggle").addEventListener("click", toggleTheme);

  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.addEventListener("click", () => handleSort(th.dataset.sort));
  });

  applyTheme(localStorage.getItem("theme") || "light");
  refresh();
});