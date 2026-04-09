const SUPABASE_URL = "https://ubvvzjbtizerositmbbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVidnZ6amJ0aXplcm9zaXRtYmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MzU0OTYsImV4cCI6MjA5MTExMTQ5Nn0.Q9VqQLTA9Gk1qJK2cZgVzrjNZdmKyXRBhzZPrKVF8iU";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ALL_OWNERS = "ทั้งหมด";
const ALL_YEARS = "ทั้งหมด";
const RENT_ITEM_NAME = "ค่าเช่า";
const MONTH_NAMES = [
  { value: "01", label: "มกราคม" },
  { value: "02", label: "กุมภาพันธ์" },
  { value: "03", label: "มีนาคม" },
  { value: "04", label: "เมษายน" },
  { value: "05", label: "พฤษภาคม" },
  { value: "06", label: "มิถุนายน" },
  { value: "07", label: "กรกฎาคม" },
  { value: "08", label: "สิงหาคม" },
  { value: "09", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" }
];

const state = {
  owner: ALL_OWNERS,
  year: ALL_YEARS,
  viewMode: "average",
  monthFrom: "01",
  monthTo: "12",
  owners: [],
  rooms: [],
  transactions: [],
  maintenanceRules: [],
  maintenanceAvailable: true,
  newEntries: [],
  entryTab: "rent",
  rentDraftYear: "",
  rentDraftMonth: "",
  rentDraftRows: []
};

const ownerFilter = document.querySelector("#ownerFilter");
const yearFilter = document.querySelector("#yearFilter");
const viewModeToggle = document.querySelector("#viewModeToggle");
const monthFromFilter = document.querySelector("#monthFromFilter");
const monthToFilter = document.querySelector("#monthToFilter");
const metricGrid = document.querySelector("#metricGrid");
const portfolioSummary = document.querySelector("#portfolioSummary");
const ownerSplit = document.querySelector("#ownerSplit");
const highlightCards = document.querySelector("#highlightCards");
const recentActivity = document.querySelector("#recentActivity");
const maintenanceAlerts = document.querySelector("#maintenanceAlerts");
const roomTableBody = document.querySelector("#roomTableBody");
const entryPreview = document.querySelector("#entryPreview");
const capitalRoom = document.querySelector("#capitalRoom");
const capitalYearSelect = document.querySelector("#capitalYearSelect");
const capitalMonthSelect = document.querySelector("#capitalMonthSelect");
const expenseRoom = document.querySelector("#expenseRoom");
const expenseYearSelect = document.querySelector("#expenseYearSelect");
const expenseMonthSelect = document.querySelector("#expenseMonthSelect");
const expenseRecurringToggle = document.querySelector("#expenseRecurringToggle");
const expenseRecurringFields = document.querySelector("#expenseRecurringFields");
const roomOwnerSelect = document.querySelector("#roomOwnerSelect");
const rentYearSelect = document.querySelector("#rentYearSelect");
const rentMonthSelect = document.querySelector("#rentMonthSelect");
const rentBatchBody = document.querySelector("#rentBatchBody");
const rentDraftInfo = document.querySelector("#rentDraftInfo");
const latestSavedMonthInfo = document.querySelector("#latestSavedMonthInfo");
const capitalStatusInfo = document.querySelector("#capitalStatusInfo");
const expenseStatusInfo = document.querySelector("#expenseStatusInfo");
const entryTabs = document.querySelectorAll(".entry-tab");
const entryTabPanels = document.querySelectorAll(".entry-tab-panel");
const capitalDeleteList = document.querySelector("#capitalDeleteList");
const expenseDeleteList = document.querySelector("#expenseDeleteList");
const maintenanceRuleList = document.querySelector("#maintenanceRuleList");
const roomDeleteList = document.querySelector("#roomDeleteList");
const ownerDeleteList = document.querySelector("#ownerDeleteList");
const roomModal = document.querySelector("#roomModal");
const openRoomModalButton = document.querySelector("#openRoomModal");
const closeRoomModalButton = document.querySelector("#closeRoomModal");
const ownerModal = document.querySelector("#ownerModal");
const openOwnerModalButton = document.querySelector("#openOwnerModal");
const closeOwnerModalButton = document.querySelector("#closeOwnerModal");

function openRoomModal() {
  if (!roomModal) return;
  roomModal.hidden = false;
  document.body.style.overflow = "hidden";
  roomModal.querySelector('input[name="roomCode"]')?.focus();
}

function closeRoomModal() {
  if (!roomModal) return;
  roomModal.hidden = true;
  document.body.style.overflow = "";
}

function openOwnerModal() {
  if (!ownerModal) return;
  ownerModal.hidden = false;
  document.body.style.overflow = "hidden";
  ownerModal.querySelector('input[name="ownerName"]')?.focus();
}

function closeOwnerModal() {
  if (!ownerModal) return;
  ownerModal.hidden = true;
  document.body.style.overflow = "";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "decimal",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatMoneyInput(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDateDisplay(value) {
  if (!value) return "-";
  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parsedDate);
}

function formatDateInput(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function parseDateInput(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";

  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, dayRaw, monthRaw, yearRaw] = slashMatch;
    const day = Number(dayRaw);
    const month = Number(monthRaw);
    const year = Number(yearRaw);
    const parsedDate = new Date(year, month - 1, day);
    const isValid = parsedDate.getFullYear() === year
      && parsedDate.getMonth() === month - 1
      && parsedDate.getDate() === day;
    if (!isValid) return null;
    return `${yearRaw}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return normalized;
  return null;
}

function formatMonthInput(value) {
  if (!value) return "";
  const monthValue = monthKeyFromDate(value);
  return /^\d{4}-\d{2}$/.test(monthValue) ? monthValue : "";
}

function parseMonthInput(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  const match = normalized.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const [, yearRaw, monthRaw] = match;
  const month = Number(monthRaw);
  if (month < 1 || month > 12) return null;
  return `${yearRaw}-${monthRaw}-01`;
}

function formatOptionalCurrency(value) {
  return value === null || value === undefined || value === "" ? "-" : formatMoneyInput(value);
}

function formatContractRange(startDate, endDate) {
  if (!startDate && !endDate) return "ยังไม่ได้ระบุ";
  return `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCompact(value) {
  return new Intl.NumberFormat("th-TH", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function monthKeyFromDate(dateValue) {
  return dateValue ? String(dateValue).slice(0, 7) : "";
}

function composeMonthValue(year, month) {
  return `${year}-${month}`;
}

function formatMonthLabel(monthValue) {
  if (!monthValue) return "-";
  const [year, month] = monthValue.split("-");
  return `${MONTH_NAMES.find((item) => item.value === month)?.label || month}/${year}`;
}

function monthStart(monthValue) {
  return `${monthValue}-01`;
}

function addMonths(dateValue, monthsToAdd) {
  const date = new Date(`${dateValue}T00:00:00`);
  const year = date.getFullYear();
  const month = date.getMonth();
  const shifted = new Date(year, month + Number(monthsToAdd), 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-01`;
}

function getDefaultMonthValue() {
  const now = new Date();
  return composeMonthValue(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
}

function getFormYearOptions() {
  const years = new Set();
  state.transactions.forEach((tx) => {
    if (tx.tx_date) years.add(String(new Date(tx.tx_date).getFullYear()));
  });
  years.add(String(new Date().getFullYear()));
  return Array.from(years).sort((a, b) => Number(b) - Number(a));
}

function buildYearOptions(selectedYear) {
  return getFormYearOptions()
    .map((year) => `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`)
    .join("");
}

function buildMonthOptions(selectedMonth) {
  return MONTH_NAMES
    .map((month) => `<option value="${month.value}" ${month.value === selectedMonth ? "selected" : ""}>${month.label}</option>`)
    .join("");
}

function getSelectedFormMonthValue(yearSelect, monthSelect) {
  return composeMonthValue(yearSelect.value, monthSelect.value);
}

function showError(message) {
  const card = `
    <article class="activity-card">
      <strong>เชื่อมต่อฐานข้อมูลไม่สำเร็จ</strong>
      <p class="subtext">${message}</p>
    </article>
  `;
  recentActivity.innerHTML = card;
  if (entryPreview) entryPreview.innerHTML = card;
}

function setHelperMessage(element, message) {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
}

function getMaintenanceRules() {
  return state.maintenanceRules.filter((rule) => {
    const room = state.rooms.find((item) => item.id === rule.room_id);
    if (!room) return false;
    return state.owner === ALL_OWNERS || room.owner_name === state.owner;
  }).map((rule) => {
    const room = state.rooms.find((item) => item.id === rule.room_id) || {};
    return {
      ...rule,
      roomCode: room.room_code || "-",
      ownerName: room.owner_name || "-"
    };
  });
}

async function upsertMaintenanceRule({ roomCode, taskName, intervalMonths, lastDoneDate, details }) {
  const targetRoom = state.rooms.find((room) => room.room_code === roomCode);
  if (!targetRoom) throw new Error("ไม่พบเลขห้องที่เลือก");

  const normalizedTaskName = String(taskName || "").trim();
  if (!normalizedTaskName) throw new Error("กรุณากรอกงานที่ต้องทำ");

  const payload = {
    room_id: targetRoom.id,
    task_name: normalizedTaskName,
    interval_months: Number(intervalMonths),
    lead_months: 1,
    last_done_date: lastDoneDate,
    next_due_date: addMonths(lastDoneDate, intervalMonths),
    notes: details || null,
    active: true
  };

  const { error } = await supabaseClient
    .from("maintenance_rules")
    .upsert(payload, { onConflict: "room_id,task_name" });

  if (error) throw error;
}

function getRentTransactions() {
  return getEnrichedTransactions().filter((tx) => tx.flow_type === "income" && tx.item_name === RENT_ITEM_NAME);
}

function getYearOptions() {
  const years = new Set();
  state.transactions.forEach((tx) => {
    if (tx.tx_date) years.add(String(new Date(tx.tx_date).getFullYear()));
  });
  return [ALL_YEARS, ...Array.from(years).sort()];
}

function getLatestTransactionYear() {
  const years = state.transactions
    .filter((tx) => tx.tx_date)
    .map((tx) => Number(new Date(tx.tx_date).getFullYear()))
    .filter((year) => !Number.isNaN(year));

  return years.length ? String(Math.max(...years)) : ALL_YEARS;
}

function getRentYearOptions() {
  const years = new Set();
  getRentTransactions().forEach((tx) => years.add(String(new Date(tx.tx_date).getFullYear())));
  years.add(getDefaultMonthValue().slice(0, 4));
  return Array.from(years).sort((a, b) => Number(b) - Number(a));
}

function getLatestSavedRentMonth() {
  const rentTransactions = getRentTransactions();
  if (!rentTransactions.length) return "";
  return rentTransactions.map((tx) => monthKeyFromDate(tx.tx_date)).sort().at(-1);
}

function getLatestSavedRentMonthForYear(year) {
  if (!year || year === ALL_YEARS) return "";
  const rentTransactions = getRentTransactions()
    .filter((tx) => String(new Date(tx.tx_date).getFullYear()) === year);
  if (!rentTransactions.length) return "";
  return rentTransactions.map((tx) => monthKeyFromDate(tx.tx_date)).sort().at(-1);
}

function getDefaultMonthRangeForYear(year) {
  if (!year || year === ALL_YEARS) {
    return { monthFrom: "01", monthTo: "12" };
  }

  const currentYear = String(new Date().getFullYear());
  const latestRentMonth = getLatestSavedRentMonthForYear(year);
  const latestMonthValue = latestRentMonth ? latestRentMonth.slice(5, 7) : "12";
  const isCurrentYear = year === currentYear;

  return {
    monthFrom: "01",
    monthTo: isCurrentYear ? latestMonthValue : "12"
  };
}

function normalizeMonthRange() {
  const defaultRange = getDefaultMonthRangeForYear(state.year);
  const monthValues = MONTH_NAMES.map((month) => month.value);

  if (!monthValues.includes(state.monthFrom)) state.monthFrom = defaultRange.monthFrom;
  if (!monthValues.includes(state.monthTo)) state.monthTo = defaultRange.monthTo;

  if (state.monthFrom > state.monthTo) {
    state.monthTo = state.monthFrom;
  }
}

function resetMonthRangeForYear(year) {
  const defaultRange = getDefaultMonthRangeForYear(year);
  state.monthFrom = defaultRange.monthFrom;
  state.monthTo = defaultRange.monthTo;
  normalizeMonthRange();
}

function getSelectedMonthCount() {
  if (state.year === ALL_YEARS || state.viewMode === "fullYear") return 12;
  return (Number(state.monthTo) - Number(state.monthFrom)) + 1;
}

function getRoomByIdMap() {
  return new Map(
    state.rooms.map((room) => [
      room.id,
      {
        roomCode: room.room_code,
        ownerName: room.owner_name,
        tenantName: room.tenant_name
      }
    ])
  );
}

function getEnrichedTransactions() {
  const roomMap = getRoomByIdMap();
  return state.transactions.map((tx) => {
    const roomInfo = roomMap.get(tx.room_id) || {};
    return {
      ...tx,
      roomCode: roomInfo.roomCode || "-",
      ownerName: roomInfo.ownerName || "-",
      tenantName: roomInfo.tenantName || "-"
    };
  });
}

function getFilteredTransactions() {
  return getEnrichedTransactions().filter((tx) => {
    const ownerMatches = state.owner === ALL_OWNERS || tx.ownerName === state.owner;
    const yearMatches = state.year === ALL_YEARS || String(new Date(tx.tx_date).getFullYear()) === state.year;
    const monthKey = monthKeyFromDate(tx.tx_date);
    const monthValue = monthKey.slice(5, 7);
    const monthMatches = state.year === ALL_YEARS
      || state.viewMode === "fullYear"
      || (monthValue >= state.monthFrom && monthValue <= state.monthTo);
    return ownerMatches && yearMatches && monthMatches;
  });
}

function getCapitalTransactions() {
  return getEnrichedTransactions().filter((tx) => {
    const ownerMatches = state.owner === ALL_OWNERS || tx.ownerName === state.owner;
    return ownerMatches && tx.flow_type === "capital";
  });
}

function getMonthCountForTransactions() {
  return getSelectedMonthCount();
}

function isRentalRoom(room) {
  return (room?.usage_type || "rental") === "rental";
}

function getRentalRooms() {
  return state.rooms.filter((room) => isRentalRoom(room));
}

function countMonthsInclusive(startMonth, endMonth) {
  if (!startMonth || !endMonth || startMonth > endMonth) return 0;
  const [startYear, startMonthValue] = startMonth.split("-").map(Number);
  const [endYear, endMonthValue] = endMonth.split("-").map(Number);
  return ((endYear - startYear) * 12) + (endMonthValue - startMonthValue) + 1;
}

function getVisibleMonthRange() {
  if (state.year !== ALL_YEARS) {
    if (state.viewMode === "fullYear") {
      return {
        startMonth: composeMonthValue(state.year, "01"),
        endMonth: composeMonthValue(state.year, "12")
      };
    }

    return {
      startMonth: composeMonthValue(state.year, state.monthFrom),
      endMonth: composeMonthValue(state.year, state.monthTo)
    };
  }

  const monthKeys = getRentTransactions()
    .map((tx) => monthKeyFromDate(tx.tx_date))
    .filter(Boolean)
    .sort();

  if (!monthKeys.length) {
    const fallback = getDefaultMonthValue();
    return { startMonth: fallback, endMonth: fallback };
  }

  return {
    startMonth: monthKeys[0],
    endMonth: monthKeys[monthKeys.length - 1]
  };
}

function getEffectiveRentStartMonth(room) {
  const explicitStartMonth = monthKeyFromDate(room.rent_start_date);
  if (explicitStartMonth) return explicitStartMonth;

  const firstRentMonth = getRentTransactions()
    .filter((tx) => tx.room_id === room.id)
    .map((tx) => monthKeyFromDate(tx.tx_date))
    .filter(Boolean)
    .sort()[0];

  return firstRentMonth || "";
}

function getEligibleRentMonthCount(room) {
  const { startMonth, endMonth } = getVisibleMonthRange();
  const rentStartMonth = getEffectiveRentStartMonth(room);
  const effectiveStartMonth = rentStartMonth && rentStartMonth > startMonth ? rentStartMonth : startMonth;
  return countMonthsInclusive(effectiveStartMonth, endMonth);
}

function calculateAverageCapitalRoi(profit, capital, monthCount) {
  if (capital <= 0 || monthCount <= 0) {
    return { averageCapital: 0, roi: 0, monthCount: monthCount || 0 };
  }

  const averageCapital = state.viewMode === "fullYear"
    ? capital
    : (capital / 12) * monthCount;
  const roi = averageCapital > 0 ? Number(((profit / averageCapital) * 100).toFixed(2)) : 0;
  return {
    averageCapital: Number(averageCapital.toFixed(2)),
    roi,
    monthCount
  };
}

function getRoomMetrics() {
  const rooms = getRentalRooms()
    .filter((room) => state.owner === ALL_OWNERS || room.owner_name === state.owner)
    .map((room) => ({
      roomId: room.id,
      roomCode: room.room_code,
      owner: room.owner_name,
      tenantName: room.tenant_name || "-",
      usageType: room.usage_type || "rental",
      depositAmount: room.deposit_amount ?? null,
      contractStartDate: room.contract_start_date || null,
      contractEndDate: room.contract_end_date || null,
      rentStartDate: room.rent_start_date || null,
      capital: 0,
      rent: 0,
      averageMonthlyRent: 0,
      expense: 0,
      profit: 0,
      roi: 0,
      averageCapital: 0,
      monthCount: state.year === ALL_YEARS ? 12 : 0
    }));

  const roomMap = new Map(rooms.map((room) => [room.roomId, room]));

  getCapitalTransactions().forEach((tx) => {
    const room = roomMap.get(tx.room_id);
    if (!room) return;
    room.capital += Number(tx.amount);
  });

  getFilteredTransactions().forEach((tx) => {
    const room = roomMap.get(tx.room_id);
    if (!room) return;
    if (tx.flow_type === "income") room.rent += Number(tx.amount);
    if (tx.flow_type === "expense") room.expense += Number(tx.amount);
  });

  rooms.forEach((room) => {
    room.profit = room.rent - room.expense;
    const roomTransactions = getFilteredTransactions().filter((tx) => tx.room_id === room.roomId);
    const monthCount = getMonthCountForTransactions(roomTransactions);
    const roiMetrics = calculateAverageCapitalRoi(room.profit, room.capital, monthCount);
    const roomSource = state.rooms.find((item) => item.id === room.roomId);
    const eligibleRentMonths = roomSource ? getEligibleRentMonthCount(roomSource) : 0;
    room.averageMonthlyRent = eligibleRentMonths > 0 ? Number((room.rent / eligibleRentMonths).toFixed(2)) : 0;
    room.monthCount = roiMetrics.monthCount;
    room.averageCapital = roiMetrics.averageCapital;
    room.roi = roiMetrics.roi;
  });

  return rooms;
}

function getOwnerMetrics() {
  const owners = state.owner === ALL_OWNERS
    ? state.owners
    : state.owners.filter((owner) => owner.name === state.owner);

  return owners.map((owner) => {
    const ownerRooms = getRoomMetrics().filter((room) => room.owner === owner.name);
    const capital = ownerRooms.reduce((sum, room) => sum + room.capital, 0);
    const rent = ownerRooms.reduce((sum, room) => sum + room.rent, 0);
    const expense = ownerRooms.reduce((sum, room) => sum + room.expense, 0);
    const profit = rent - expense;
    const ownerTransactions = getFilteredTransactions().filter((tx) => tx.ownerName === owner.name);
    const monthCount = getMonthCountForTransactions(ownerTransactions);
    const roiMetrics = calculateAverageCapitalRoi(profit, capital, monthCount);
    return {
      name: owner.name,
      rooms: ownerRooms.length,
      capital,
      rent,
      expense,
      profit,
      roi: roiMetrics.roi,
      averageCapital: roiMetrics.averageCapital,
      monthCount: roiMetrics.monthCount
    };
  });
}

function getSummary() {
  const rooms = getRoomMetrics();
  const capital = rooms.reduce((sum, room) => sum + room.capital, 0);
  const rent = rooms.reduce((sum, room) => sum + room.rent, 0);
  const expense = rooms.reduce((sum, room) => sum + room.expense, 0);
  const profit = rent - expense;
  const monthCount = getMonthCountForTransactions(getFilteredTransactions());
  const roiMetrics = calculateAverageCapitalRoi(profit, capital, monthCount);
  return {
    rooms: rooms.length,
    capital,
    rent,
    expense,
    profit,
    averageMonthlyRent: rooms.reduce((sum, room) => sum + room.averageMonthlyRent, 0),
    roi: roiMetrics.roi,
    averageCapital: roiMetrics.averageCapital,
    monthCount: roiMetrics.monthCount
  };
}

function ensureRentDraftSelection() {
  const fallback = getDefaultMonthValue();
  const [fallbackYear, fallbackMonth] = fallback.split("-");
  if (!state.rentDraftYear) state.rentDraftYear = fallbackYear;
  if (!state.rentDraftMonth) state.rentDraftMonth = fallbackMonth;
}

function getSelectedRentMonthValue() {
  ensureRentDraftSelection();
  return composeMonthValue(state.rentDraftYear, state.rentDraftMonth);
}

function buildFilters() {
  const selectedExpenseRoom = expenseRoom.value;
  const selectedCapitalRoom = capitalRoom.value;
  const selectedOwnerId = roomOwnerSelect.value;
  normalizeMonthRange();
  const ownerOptions = [ALL_OWNERS, ...state.owners.map((owner) => owner.name)];
  ownerFilter.innerHTML = ownerOptions
    .map((owner) => `<option value="${owner}" ${owner === state.owner ? "selected" : ""}>${owner}</option>`)
    .join("");

  yearFilter.innerHTML = getYearOptions()
    .map((year) => `<option value="${year}" ${year === state.year ? "selected" : ""}>${year}</option>`)
    .join("");

  monthFromFilter.innerHTML = MONTH_NAMES
    .map((month) => `<option value="${month.value}" ${month.value === state.monthFrom ? "selected" : ""}>${month.label}</option>`)
    .join("");
  monthToFilter.innerHTML = MONTH_NAMES
    .map((month) => `<option value="${month.value}" ${month.value === state.monthTo ? "selected" : ""}>${month.label}</option>`)
    .join("");
  const monthFiltersDisabled = state.year === ALL_YEARS || state.viewMode === "fullYear";
  monthFromFilter.disabled = monthFiltersDisabled;
  monthToFilter.disabled = monthFiltersDisabled;
  monthFromFilter.closest("label")?.classList.toggle("filter-disabled", monthFiltersDisabled);
  monthToFilter.closest("label")?.classList.toggle("filter-disabled", monthFiltersDisabled);
  document.querySelectorAll(".mode-toggle-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewMode === state.viewMode);
  });

  expenseRoom.innerHTML = state.rooms
    .map((room) => `<option value="${room.room_code}" ${room.room_code === selectedExpenseRoom ? "selected" : ""}>${room.room_code}</option>`)
    .join("");

  capitalRoom.innerHTML = state.rooms
    .map((room) => `<option value="${room.room_code}" ${room.room_code === selectedCapitalRoom ? "selected" : ""}>${room.room_code}</option>`)
    .join("");

  const [defaultYear, defaultMonth] = getDefaultMonthValue().split("-");
  capitalYearSelect.innerHTML = buildYearOptions(capitalYearSelect.value || defaultYear);
  capitalMonthSelect.innerHTML = buildMonthOptions(capitalMonthSelect.value || defaultMonth);
  expenseYearSelect.innerHTML = buildYearOptions(expenseYearSelect.value || defaultYear);
  expenseMonthSelect.innerHTML = buildMonthOptions(expenseMonthSelect.value || defaultMonth);

  roomOwnerSelect.innerHTML = state.owners
    .map((owner) => `<option value="${owner.id}" ${owner.id === selectedOwnerId ? "selected" : ""}>${owner.name}</option>`)
    .join("");

  ensureRentDraftSelection();
  rentYearSelect.innerHTML = getRentYearOptions()
    .map((year) => `<option value="${year}" ${year === state.rentDraftYear ? "selected" : ""}>${year}</option>`)
    .join("");
  rentMonthSelect.innerHTML = MONTH_NAMES
    .map((month) => `<option value="${month.value}" ${month.value === state.rentDraftMonth ? "selected" : ""}>${month.label}</option>`)
    .join("");
}

function buildRentDraft(monthValue) {
  const rentTransactions = getRentTransactions();

  state.rentDraftRows = getRentalRooms()
    .slice()
    .sort((a, b) => a.room_code.localeCompare(b.room_code))
    .map((room) => {
      const roomRents = rentTransactions
        .filter((tx) => tx.room_id === room.id)
        .sort((a, b) => new Date(b.tx_date) - new Date(a.tx_date));

      const current = roomRents.find((tx) => monthKeyFromDate(tx.tx_date) === monthValue);
      const latestBefore = roomRents.find((tx) => monthKeyFromDate(tx.tx_date) < monthValue);

      if (current) {
        return {
          roomId: room.id,
          roomCode: room.room_code,
          ownerName: room.owner_name,
          txId: current.id,
          amount: Number(current.amount),
          details: current.details || "",
          source: "existing",
          previousText: formatCurrency(current.amount)
        };
      }

      if (latestBefore) {
        return {
          roomId: room.id,
          roomCode: room.room_code,
          ownerName: room.owner_name,
          tenantName: room.tenant_name || "",
          txId: null,
          amount: Number(latestBefore.amount),
          details: latestBefore.details || "",
          source: "latest",
          previousText: `${formatCurrency(latestBefore.amount)} จาก ${formatMonthLabel(monthKeyFromDate(latestBefore.tx_date))}`
        };
      }

      return {
        roomId: room.id,
        roomCode: room.room_code,
        ownerName: room.owner_name,
        tenantName: room.tenant_name || "",
        txId: null,
        amount: "",
        details: "",
        source: "empty",
        previousText: "-"
      };
    });
}

function getSourceLabel(source) {
  if (source === "existing") return "มีข้อมูลเดือนนี้แล้ว";
  if (source === "latest") return "เติมจากเดือนล่าสุด";
  if (source === "default") return "เติมจากค่าที่จำไว้";
  return "ยังไม่มีข้อมูลเดิม";
}

function renderRentDraft() {
  const selectedMonth = getSelectedRentMonthValue();
  const latestSavedMonth = getLatestSavedRentMonth();

  latestSavedMonthInfo.textContent = latestSavedMonth
    ? `เดือนล่าสุดที่บันทึกค่าเช่าไว้คือ ${formatMonthLabel(latestSavedMonth)}`
    : "ยังไม่มีประวัติการบันทึกค่าเช่าในระบบ";

  rentDraftInfo.textContent = `กำลังบันทึกค่าเช่าของเดือน ${formatMonthLabel(selectedMonth)} ถ้าเดือนนี้มีข้อมูลอยู่แล้ว ระบบจะดึงค่าที่เคยบันทึกมาให้แก้ไขได้ทันที`;

  rentBatchBody.innerHTML = state.rentDraftRows.map((row, index) => `
    <tr>
      <td>${row.roomCode}</td>
      <td>${row.ownerName}</td>
      <td><span class="status-pill status-${row.source}">${getSourceLabel(row.source)}</span></td>
      <td>${row.previousText}</td>
      <td><input type="number" step="0.01" inputmode="decimal" data-index="${index}" data-field="amount" value="${row.amount}" placeholder="เช่น 6500"></td>
      <td><input type="text" data-index="${index}" data-field="details" value="${row.details}" placeholder="รายละเอียดเพิ่มเติม"></td>
    </tr>
  `).join("");
}

function renderMaintenanceAlerts() {
  if (!state.maintenanceAvailable) {
    maintenanceAlerts.innerHTML = `<article class="activity-card"><strong>ยังไม่ได้เปิดระบบงานประจำ</strong><p class="subtext">ให้รันไฟล์ SQL งานประจำใน Supabase ก่อน แล้วรายการเตือนจะขึ้นตรงนี้</p></article>`;
    return;
  }

  const today = new Date();
  const nextMonthKey = composeMonthValue(
    String(today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear()),
    String(((today.getMonth() + 1) % 12) + 1).padStart(2, "0")
  );

  const alerts = getMaintenanceRules()
    .filter((rule) => rule.active && monthKeyFromDate(rule.next_due_date) === nextMonthKey)
    .sort((a, b) => a.roomCode.localeCompare(b.roomCode));

  maintenanceAlerts.innerHTML = alerts.length
    ? alerts.map((rule) => `
      <article class="activity-card maintenance-alert-card">
        <strong>${rule.roomCode} • ${rule.task_name}</strong>
        <p class="subtext">${rule.ownerName}</p>
        <p class="subtext">ถึงรอบในเดือน ${formatMonthLabel(monthKeyFromDate(rule.next_due_date))} • ทำทุก ${rule.interval_months} เดือน</p>
      </article>
    `).join("")
    : `<article class="activity-card"><strong>ยังไม่มีงานที่ต้องทำในเดือนถัดไป</strong><p class="subtext">ถ้ามีงานประจำใกล้ถึงรอบ ระบบจะแจ้งเตือนตรงนี้ล่วงหน้า 1 เดือน</p></article>`;
}

function renderMaintenanceRules() {
  if (!state.maintenanceAvailable) {
    maintenanceRuleList.innerHTML = `<article class="management-item"><div><strong>ยังไม่ได้เปิดระบบงานประจำ</strong><p class="subtext">รันไฟล์ SQL งานประจำใน Supabase ก่อน แล้วจึงตั้งรอบงานได้</p></div></article>`;
    return;
  }

  const rules = getMaintenanceRules()
    .filter((rule) => rule.active)
    .sort((a, b) => a.roomCode.localeCompare(b.roomCode));

  maintenanceRuleList.innerHTML = rules.length
    ? rules.map((rule) => `
      <article class="management-item">
        <div>
          <strong>${rule.roomCode} • ${rule.task_name}</strong>
          <p class="subtext">ทุก ${rule.interval_months} เดือน • รอบถัดไป ${formatMonthLabel(monthKeyFromDate(rule.next_due_date))}</p>
        </div>
        <button type="button" class="danger-button" data-maintenance-id="${rule.id}" data-maintenance-task="${rule.task_name}" data-maintenance-room="${rule.roomCode}">ลบรอบงาน</button>
      </article>
    `).join("")
    : `<article class="management-item"><div><strong>ยังไม่มีงานประจำ</strong><p class="subtext">ติ๊ก "เป็นงานประจำที่ต้องทำซ้ำ" ตอนบันทึกค่าใช้จ่ายเพื่อเพิ่มรายการ</p></div></article>`;
}

function renderManagementLists() {
  const capitalRows = getEnrichedTransactions()
    .filter((tx) => tx.flow_type === "capital")
    .sort((a, b) => new Date(b.tx_date) - new Date(a.tx_date))
    .slice(0, 20);

  const selectedExpenseRoom = expenseRoom?.value || "";
  const expenseRows = getFilteredTransactions()
    .filter((tx) => tx.flow_type === "expense")
    .filter((tx) => !selectedExpenseRoom || tx.roomCode === selectedExpenseRoom)
    .sort((a, b) => new Date(b.tx_date) - new Date(a.tx_date))
    .slice(0, 20);

  capitalDeleteList.innerHTML = capitalRows.map((tx) => `
    <article class="management-item">
      <div>
        <strong>${tx.roomCode} • ${formatCurrency(tx.amount)}</strong>
        <p class="subtext">${tx.item_name || "ทุน"} • ${tx.tx_date}${tx.details ? ` • ${tx.details}` : ""}</p>
      </div>
      <button type="button" class="danger-button" data-capital-id="${tx.id}" data-capital-room="${tx.roomCode}">ลบทุน</button>
    </article>
  `).join("") || `<article class="management-item"><div><strong>ยังไม่มีรายการทุน</strong><p class="subtext">เมื่อมีการบันทึกทุน รายการจะขึ้นที่นี่</p></div></article>`;

  expenseDeleteList.innerHTML = expenseRows.map((tx) => `
    <article class="management-item">
      <div>
        <strong>${tx.roomCode} • ${formatCurrency(tx.amount)}</strong>
        <p class="subtext">${tx.tx_date}${tx.details ? ` • ${tx.details}` : ""}</p>
      </div>
      <button type="button" class="danger-button" data-expense-id="${tx.id}" data-expense-room="${tx.roomCode}">ลบค่าใช้จ่าย</button>
    </article>
  `).join("") || `<article class="management-item"><div><strong>ยังไม่มีค่าใช้จ่าย</strong><p class="subtext">รายการนี้จะอิงตามห้องที่เลือกและปีข้อมูลด้านบน</p></div></article>`;

  roomDeleteList.innerHTML = state.rooms
    .slice()
    .sort((a, b) => a.room_code.localeCompare(b.room_code))
    .map((room) => `
      <article class="management-item">
        <div>
          <strong>${room.room_code}</strong>
          <p class="subtext">${room.owner_name}</p>
        </div>
        <button type="button" class="danger-button" data-room-id="${room.id}" data-room-code="${room.room_code}">ลบห้อง</button>
      </article>
    `).join("");

  ownerDeleteList.innerHTML = state.owners
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((owner) => {
      const roomCount = state.rooms.filter((room) => room.owner_id === owner.id).length;
      return `
        <article class="management-item">
          <div>
            <strong>${owner.name}</strong>
            <p class="subtext">${roomCount} ห้องในระบบ</p>
          </div>
          <button type="button" class="danger-button" data-owner-id="${owner.id}" data-owner-name="${owner.name}">ลบเจ้าของห้อง</button>
        </article>
      `;
    }).join("");
}

function renderMetrics() {
  const summary = getSummary();
  const metrics = [
    { label: "กำไรสุทธิ", value: formatCurrency(summary.profit), foot: `ROI ${summary.roi}%` },
    { label: "ค่าเช่ารวม", value: formatCurrency(summary.rent), foot: `${summary.rooms} ห้องที่มีข้อมูล` },
    { label: "ค่าใช้จ่ายรวม", value: formatCurrency(summary.expense), foot: "ค่าใช้จ่ายรวมทุกรายการ" },
    { label: "มูลค่าลงทุน", value: formatCurrency(summary.capital), foot: `คิดเป็น ${formatCompact(summary.capital)}` }
  ];
  if (state.year !== ALL_YEARS && state.viewMode !== "fullYear") {
    metrics[0].foot = `ROI ${summary.roi}% จากทุนเฉลี่ย ${summary.monthCount} เดือน`;
    metrics[3].foot = `ทุนเฉลี่ย ${summary.monthCount} เดือน = ${formatCurrency(summary.averageCapital)}`;
  }

  metricGrid.innerHTML = metrics.map((metric) => `
    <article class="metric-card">
      <p class="eyebrow">${metric.label}</p>
      <h3>${metric.value}</h3>
      <p class="metric-foot">${metric.foot}</p>
    </article>
  `).join("");
}

function renderPortfolioSummary() {
  const rooms = [...getRoomMetrics()].sort((a, b) => b.roi - a.roi);

  portfolioSummary.innerHTML = rooms.map((room) => `
    <article class="summary-tile room-summary-tile">
      <div class="room-summary-head">
        <strong>${room.roomCode}</strong>
        <span class="badge-profit">${room.roi}%</span>
      </div>
      <p class="subtext">${room.owner}</p>
      <div class="owner-breakdown-grid">
        <div><span>ทุน</span><strong>${formatCurrency(room.capital)}</strong></div>
        <div><span>ค่าเช่า</span><strong>${formatCurrency(room.rent)}</strong></div>
        <div><span>ค่าใช้จ่าย</span><strong>${formatCurrency(room.expense)}</strong></div>
        <div><span>กำไร</span><strong>${formatCurrency(room.profit)}</strong></div>
      </div>
    </article>
  `).join("");
}

function renderOwnerSplit() {
  ownerSplit.innerHTML = getOwnerMetrics().map((owner) => `
    <article class="owner-breakdown-card">
      <div class="owner-breakdown-head">
        <div>
          <strong>${owner.name}</strong>
          <p class="subtext">${owner.rooms} ห้อง</p>
        </div>
        <div class="badge-profit">${owner.roi}%</div>
      </div>
      <div class="owner-breakdown-grid">
        <div><span>ทุน</span><strong>${formatCurrency(owner.capital)}</strong></div>
        <div><span>ค่าเช่า</span><strong>${formatCurrency(owner.rent)}</strong></div>
        <div><span>ค่าใช้จ่าย</span><strong>${formatCurrency(owner.expense)}</strong></div>
        <div><span>กำไร</span><strong>${formatCurrency(owner.profit)}</strong></div>
      </div>
    </article>
  `).join("");
}

function renderHighlights() {
  const rooms = [...getRoomMetrics()].sort((a, b) => b.profit - a.profit).slice(0, 3);
  highlightCards.innerHTML = rooms.map((room, index) => `
    <article class="highlight-card">
      <div>
        <p class="eyebrow">Top ${index + 1}</p>
        <strong>${room.roomCode}</strong>
        <p class="subtext">${room.owner} • ค่าเช่ารวม ${formatCurrency(room.rent)}</p>
      </div>
      <div class="badge-profit">${formatCurrency(room.profit)}</div>
    </article>
  `).join("");
}

function renderRecentActivity() {
  const merged = [...state.newEntries, ...getFilteredTransactions()]
    .sort((a, b) => new Date(b.tx_date || b.date) - new Date(a.tx_date || a.date))
    .slice(0, 6);

  recentActivity.innerHTML = merged.map((entry) => `
    <article class="activity-card">
      <strong>${entry.roomCode} • ${entry.item_name || entry.type}</strong>
      <p class="subtext">${entry.details || "-"}</p>
      <p class="subtext">${entry.tx_date || entry.date} • ${formatCurrency(entry.amount)}</p>
    </article>
  `).join("");

  if (entryPreview) {
    entryPreview.innerHTML = state.newEntries.length
      ? state.newEntries.map((entry) => `
        <article class="activity-card">
          <strong>${entry.roomCode} • ${entry.item_name || entry.type}</strong>
          <p class="subtext">${entry.details || "-"}</p>
          <p class="subtext">${entry.tx_date || entry.date} • ${formatCurrency(entry.amount)}</p>
        </article>
      `).join("")
      : `<article class="activity-card"><strong>ยังไม่มีรายการใหม่</strong><p class="subtext">เมื่อบันทึกรายการสำเร็จ จะขึ้นแสดงตรงนี้ทันที</p></article>`;
  }
}

function renderTable() {
  const rooms = [...getRoomMetrics()].sort((a, b) => b.profit - a.profit);
  roomTableBody.innerHTML = rooms.map((room) => `
    <tr>
      <td>${room.roomCode}</td>
      <td>${room.owner}</td>
      <td>${formatCurrency(room.capital)}</td>
      <td>${formatCurrency(room.rent)}</td>
      <td>${formatCurrency(room.expense)}</td>
      <td>${formatCurrency(room.profit)}</td>
      <td>${room.roi}%</td>
    </tr>
  `).join("");
}

function renderAll() {
  buildFilters();
  renderMetrics();
  renderPortfolioSummary();
  renderOwnerSplit();
  renderMaintenanceAlerts();
  renderHighlights();
  renderRecentActivity();
  renderTable();
  renderRentDraft();
  renderManagementLists();
  renderMaintenanceRules();
}

function applyOverviewLabels() {
  const overviewPanels = document.querySelectorAll("#overview .panel-grid:first-of-type .panel h3");
  if (overviewPanels[0]) {
    overviewPanels[0].textContent = "ผลตอบแทนรายห้อง";
  }
  if (overviewPanels[1]) {
    overviewPanels[1].textContent = "สรุปตามเจ้าของห้อง";
  }
}

function reorderOverviewPanels() {
  const firstGrid = document.querySelector("#overview .panel-grid");
  if (!firstGrid) return;

  const portfolioPanel = firstGrid.querySelector(".panel:has(#portfolioSummary)");
  const ownerPanel = firstGrid.querySelector(".panel:has(#ownerSplit)");

  if (portfolioPanel && ownerPanel) {
    firstGrid.insertBefore(ownerPanel, portfolioPanel);
  }
}

function bindNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".section");
  navLinks.forEach((button) => {
    button.addEventListener("click", () => {
      navLinks.forEach((link) => link.classList.remove("active"));
      sections.forEach((section) => section.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.section).classList.add("active");
    });
  });
}

function bindFilters() {
  ownerFilter.addEventListener("change", (event) => {
    state.owner = event.target.value;
    renderAll();
  });
  yearFilter.addEventListener("change", (event) => {
    state.year = event.target.value;
    resetMonthRangeForYear(state.year);
    renderAll();
  });
  monthFromFilter.addEventListener("change", (event) => {
    state.monthFrom = event.target.value;
    normalizeMonthRange();
    renderAll();
  });
  monthToFilter.addEventListener("change", (event) => {
    state.monthTo = event.target.value;
    normalizeMonthRange();
    renderAll();
  });
  viewModeToggle?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.viewMode) return;
    state.viewMode = target.dataset.viewMode;
    renderAll();
  });
}

function setEntryTab(tabName) {
  state.entryTab = tabName;
  entryTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.entryTab === tabName);
  });
  entryTabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.entryPanel === tabName);
  });
}

function bindEntryTabs() {
  entryTabs.forEach((button) => {
    button.addEventListener("click", () => {
      setEntryTab(button.dataset.entryTab || "rent");
    });
  });
}

function toggleExpenseRecurringFields() {
  if (!expenseRecurringToggle || !expenseRecurringFields) return;
  expenseRecurringFields.hidden = !expenseRecurringToggle.checked;
}

function bindExpenseRecurringToggle() {
  if (!expenseRecurringToggle) return;
  expenseRecurringToggle.addEventListener("change", toggleExpenseRecurringFields);
  toggleExpenseRecurringFields();
}

function bindExpenseDeleteFilters() {
  if (expenseRoom) {
    expenseRoom.addEventListener("change", () => {
      renderManagementLists();
    });
  }

  if (capitalRoom) {
    capitalRoom.addEventListener("change", () => {
      renderManagementLists();
    });
  }
}

function rebuildRentDraftFromSelectors() {
  state.rentDraftYear = rentYearSelect.value;
  state.rentDraftMonth = rentMonthSelect.value;
  buildRentDraft(getSelectedRentMonthValue());
  renderRentDraft();
}

function bindRentDraft() {
  rentYearSelect.addEventListener("change", rebuildRentDraftFromSelectors);
  rentMonthSelect.addEventListener("change", rebuildRentDraftFromSelectors);
  document.querySelector("#reloadRentDraft").addEventListener("click", rebuildRentDraftFromSelectors);
  rentBatchBody.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const index = Number(target.dataset.index);
    const field = target.dataset.field;
    if (!Number.isInteger(index) || !field) return;
    state.rentDraftRows[index][field] = target.value;
  });
  document.querySelector("#saveMonthlyRent").addEventListener("click", async () => {
    try {
      await saveMonthlyRent();
    } catch (error) {
      alert(`บันทึกค่าเช่าไม่สำเร็จ: ${error.message}`);
    }
  });
}

async function insertTransaction(payload) {
  const targetRoom = state.rooms.find((room) => room.room_code === payload.roomCode);
  if (!targetRoom) throw new Error("ไม่พบเลขห้องที่เลือก");

  const { data, error } = await supabaseClient
    .from("transactions")
    .insert({
      room_id: targetRoom.id,
      tx_date: payload.txDate,
      flow_type: payload.flowType,
      item_name: payload.itemName,
      amount: payload.amount,
      details: payload.details || null
    })
    .select()
    .single();

  if (error) throw error;

  state.newEntries.unshift({
    ...data,
    roomCode: targetRoom.room_code,
    item_name: payload.itemName
  });
}

async function saveMonthlyRent() {
  const txDate = monthStart(getSelectedRentMonthValue());
  const rowsToSave = state.rentDraftRows
    .map((row) => ({ ...row, amount: row.amount === "" ? "" : Number(row.amount) }))
    .filter((row) => row.amount !== "" && !Number.isNaN(row.amount) && row.amount >= 0);

  if (!rowsToSave.length) {
    alert("ยังไม่มีค่าเช่าที่พร้อมบันทึก");
    return;
  }

  for (const row of rowsToSave) {
    if (row.txId) {
      const { error } = await supabaseClient
        .from("transactions")
        .update({
          tx_date: txDate,
          item_name: RENT_ITEM_NAME,
          amount: row.amount,
          details: row.details || null
        })
        .eq("id", row.txId);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from("transactions")
        .insert({
          room_id: row.roomId,
          tx_date: txDate,
          flow_type: "income",
          item_name: RENT_ITEM_NAME,
          amount: row.amount,
          details: row.details || null
        });
      if (error) throw error;
    }
  }

  alert(`บันทึกค่าเช่าเดือน ${formatMonthLabel(getSelectedRentMonthValue())} เรียบร้อย`);
  await loadDashboardData();
}

function bindRoomForm() {
  document.querySelector("#roomForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const roomCode = String(formData.get("roomCode") || "").trim();
    const ownerId = String(formData.get("ownerId") || "").trim();
    const tenantName = String(formData.get("tenantName") || "").trim();
    const usageType = String(formData.get("usageType") || "rental").trim() || "rental";
    const contractStartDateInput = String(formData.get("contractStartDate") || "").trim();
    const contractEndDateInput = String(formData.get("contractEndDate") || "").trim();
    const contractStartDate = parseDateInput(contractStartDateInput);
    const contractEndDate = parseDateInput(contractEndDateInput);
    const rentStartMonthInput = String(formData.get("rentStartMonth") || "").trim();
    const rentStartDate = parseMonthInput(rentStartMonthInput);
    const depositRaw = String(formData.get("depositAmount") || "").trim();
    const depositAmount = depositRaw === "" ? null : Number(depositRaw);
    const notes = String(formData.get("notes") || "").trim();

    if (!roomCode || !ownerId) {
      alert("กรุณากรอกเลขห้องและเลือกเจ้าของห้อง");
      return;
    }

    if (depositRaw !== "" && (Number.isNaN(depositAmount) || depositAmount < 0)) {
      alert("กรุณากรอกค่ามัดจำให้ถูกต้อง");
      return;
    }

    if (contractStartDate === null || contractEndDate === null) {
      alert("กรุณากรอกวันที่เป็นรูปแบบ วัน/เดือน/ปี");
      return;
    }

    if (rentStartDate === null) {
      alert("กรุณาเลือกเดือนเริ่มปล่อยเช่าให้ถูกต้อง");
      return;
    }

    if (!["rental", "owner_use"].includes(usageType)) {
      alert("กรุณาเลือกการใช้งานห้องให้ถูกต้อง");
      return;
    }

    if (contractStartDate && contractEndDate && contractStartDate > contractEndDate) {
      alert("วันสิ้นสุดสัญญาต้องไม่น้อยกว่าวันเริ่มสัญญา");
      return;
    }

    try {
      const { error } = await supabaseClient.from("rooms").insert({
        room_code: roomCode,
        owner_id: ownerId,
        tenant_name: tenantName || null,
        usage_type: usageType,
        contract_start_date: contractStartDate || null,
        contract_end_date: contractEndDate || null,
        rent_start_date: usageType === "rental" ? (rentStartDate || null) : null,
        deposit_amount: depositAmount,
        notes: notes || null
      });
      if (error) throw error;
      alert(`เพิ่มห้อง ${roomCode} เรียบร้อย`);
      form.reset();
      closeRoomModal();
      await loadDashboardData();
    } catch (error) {
      alert(`เพิ่มห้องไม่สำเร็จ: ${error.message}`);
    }
  });
}

function bindRoomModal() {
  openRoomModalButton?.addEventListener("click", openRoomModal);
  closeRoomModalButton?.addEventListener("click", closeRoomModal);
  roomModal?.addEventListener("click", (event) => {
    if (event.target === roomModal) {
      closeRoomModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && roomModal && !roomModal.hidden) {
      closeRoomModal();
    }
    if (event.key === "Escape" && ownerModal && !ownerModal.hidden) {
      closeOwnerModal();
    }
  });
}

function bindCapitalForm() {
  document.querySelector("#capitalForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const roomCode = String(formData.get("roomCode") || "").trim();
    const amount = Number(formData.get("amount"));
    const monthLabel = formatMonthLabel(getSelectedFormMonthValue(capitalYearSelect, capitalMonthSelect));
    setHelperMessage(capitalStatusInfo, "");

    try {
      await insertTransaction({
        roomCode,
        txDate: monthStart(getSelectedFormMonthValue(capitalYearSelect, capitalMonthSelect)),
        flowType: "capital",
        itemName: String(formData.get("itemName") || "").trim() || "ทุน",
        amount,
        details: formData.get("details")
      });
      form.reset();
      await loadDashboardData();
      setHelperMessage(capitalStatusInfo, `บันทึกทุนสำเร็จ: ห้อง ${roomCode} จำนวน ${formatMoneyInput(amount)} เดือน ${monthLabel}`);
    } catch (error) {
      setHelperMessage(capitalStatusInfo, "");
      alert(`บันทึกทุนไม่สำเร็จ: ${error.message}`);
    }
  });
}

function bindOwnerForm() {
  document.querySelector("#ownerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const ownerName = String(formData.get("ownerName") || "").trim();

    if (!ownerName) {
      alert("กรุณากรอกชื่อเจ้าของห้อง");
      return;
    }

    try {
      const { error } = await supabaseClient.from("owners").insert({ name: ownerName });
      if (error) throw error;
      alert(`เพิ่มเจ้าของห้อง ${ownerName} เรียบร้อย`);
      form.reset();
      closeOwnerModal();
      await loadDashboardData();
    } catch (error) {
      alert(`เพิ่มเจ้าของห้องไม่สำเร็จ: ${error.message}`);
    }
  });
}

function bindOwnerModal() {
  openOwnerModalButton?.addEventListener("click", openOwnerModal);
  closeOwnerModalButton?.addEventListener("click", closeOwnerModal);
  ownerModal?.addEventListener("click", (event) => {
    if (event.target === ownerModal) {
      closeOwnerModal();
    }
  });
}

function bindManagementDeletes() {
  capitalDeleteList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.capitalId) return;
    const capitalId = target.dataset.capitalId;
    const roomCode = target.dataset.capitalRoom;
    const confirmed = window.confirm(`ลบรายการทุนของห้อง ${roomCode} ใช่หรือไม่?`);
    if (!confirmed) return;

    try {
      const { error } = await supabaseClient.from("transactions").delete().eq("id", capitalId);
      if (error) throw error;
      alert(`ลบรายการทุนของห้อง ${roomCode} เรียบร้อย`);
      await loadDashboardData();
    } catch (error) {
      alert(`ลบทุนไม่สำเร็จ: ${error.message}`);
    }
  });

  expenseDeleteList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.expenseId) return;
    const expenseId = target.dataset.expenseId;
    const roomCode = target.dataset.expenseRoom;
    const confirmed = window.confirm(`ลบค่าใช้จ่ายของห้อง ${roomCode} ใช่หรือไม่?`);
    if (!confirmed) return;

    try {
      const { error } = await supabaseClient.from("transactions").delete().eq("id", expenseId);
      if (error) throw error;
      alert(`ลบค่าใช้จ่ายของห้อง ${roomCode} เรียบร้อย`);
      await loadDashboardData();
    } catch (error) {
      alert(`ลบค่าใช้จ่ายไม่สำเร็จ: ${error.message}`);
    }
  });

  maintenanceRuleList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.maintenanceId) return;
    const ruleId = target.dataset.maintenanceId;
    const roomCode = target.dataset.maintenanceRoom;
    const taskName = target.dataset.maintenanceTask;
    const confirmed = window.confirm(`ลบรอบงาน "${taskName}" ของห้อง ${roomCode} ใช่หรือไม่?`);
    if (!confirmed) return;

    try {
      const { error } = await supabaseClient.from("maintenance_rules").delete().eq("id", ruleId);
      if (error) throw error;
      alert(`ลบรอบงาน "${taskName}" ของห้อง ${roomCode} เรียบร้อย`);
      await loadDashboardData();
    } catch (error) {
      alert(`ลบรอบงานไม่สำเร็จ: ${error.message}`);
    }
  });

  roomDeleteList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.roomId) return;
    const roomId = target.dataset.roomId;
    const roomCode = target.dataset.roomCode;
    const confirmed = window.confirm(`ลบห้อง ${roomCode} ใช่หรือไม่?\nรายการธุรกรรมของห้องนี้จะถูกลบตามไปด้วย`);
    if (!confirmed) return;

    try {
      const { error } = await supabaseClient.from("rooms").delete().eq("id", roomId);
      if (error) throw error;
      alert(`ลบห้อง ${roomCode} เรียบร้อย`);
      await loadDashboardData();
    } catch (error) {
      alert(`ลบห้องไม่สำเร็จ: ${error.message}`);
    }
  });

  ownerDeleteList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.ownerId) return;
    const ownerId = target.dataset.ownerId;
    const ownerName = target.dataset.ownerName;
    const confirmed = window.confirm(`ลบเจ้าของห้อง ${ownerName} ใช่หรือไม่?\nถ้ายังมีห้องผูกอยู่ ระบบจะไม่ยอมให้ลบ`);
    if (!confirmed) return;

    try {
      const { error } = await supabaseClient.from("owners").delete().eq("id", ownerId);
      if (error) throw error;
      alert(`ลบเจ้าของห้อง ${ownerName} เรียบร้อย`);
      await loadDashboardData();
    } catch (error) {
      alert(`ลบเจ้าของห้องไม่สำเร็จ: ${error.message}`);
    }
  });
}

function bindExpenseForm() {
  document.querySelector("#expenseForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const roomCode = String(formData.get("roomCode") || "").trim();
    const amount = Number(formData.get("amount"));
    const selectedMonthValue = getSelectedFormMonthValue(expenseYearSelect, expenseMonthSelect);
    const monthLabel = formatMonthLabel(selectedMonthValue);
    const isRecurring = formData.get("isRecurring") === "on";
    const details = String(formData.get("details") || "").trim();
    const taskName = details;
    const intervalMonths = Number(formData.get("intervalMonths") || 0);
    setHelperMessage(expenseStatusInfo, "");

    if (isRecurring && (!taskName || !intervalMonths || intervalMonths < 1)) {
      alert("ถ้าเป็นงานประจำ กรุณากรอกรายละเอียดและจำนวนเดือนให้ครบ");
      return;
    }

    if (isRecurring && !state.maintenanceAvailable) {
      alert("ยังไม่ได้เปิดระบบงานประจำใน Supabase ให้รันไฟล์ supabase-maintenance-rules.sql ก่อน");
      return;
    }

    try {
      await insertTransaction({
        roomCode,
        txDate: monthStart(selectedMonthValue),
        flowType: "expense",
        itemName: "ค่าใช้จ่าย",
        amount,
        details
      });
      if (isRecurring) {
        await upsertMaintenanceRule({
          roomCode,
          taskName,
          intervalMonths,
          lastDoneDate: monthStart(selectedMonthValue),
          details
        });
      }
      const selectedRoom = expenseRoom.value;
      const selectedYear = expenseYearSelect.value;
      const selectedMonth = expenseMonthSelect.value;
      const recurringChecked = expenseRecurringToggle.checked;

      form.reset();
      expenseRoom.value = selectedRoom;
      expenseYearSelect.value = selectedYear;
      expenseMonthSelect.value = selectedMonth;
      expenseRecurringToggle.checked = recurringChecked;
      await loadDashboardData();
      expenseRoom.value = selectedRoom;
      expenseYearSelect.value = selectedYear;
      expenseMonthSelect.value = selectedMonth;
      expenseRecurringToggle.checked = recurringChecked;
      toggleExpenseRecurringFields();
      setHelperMessage(
        expenseStatusInfo,
        isRecurring
          ? `บันทึกค่าใช้จ่ายสำเร็จ: ห้อง ${roomCode} จำนวน ${formatMoneyInput(amount)} เดือน ${monthLabel} และตั้งรอบงาน "${taskName}" ทุก ${intervalMonths} เดือนแล้ว`
          : `บันทึกค่าใช้จ่ายสำเร็จ: ห้อง ${roomCode} จำนวน ${formatMoneyInput(amount)} เดือน ${monthLabel}`
      );
    } catch (error) {
      setHelperMessage(expenseStatusInfo, "");
      alert(`บันทึกค่าใช้จ่ายไม่สำเร็จ: ${error.message}`);
    }
  });
}

async function loadDashboardData() {
  const [
    { data: owners, error: ownersError },
    { data: rooms, error: roomsError },
    { data: transactions, error: transactionsError }
  ] = await Promise.all([
    supabaseClient.from("owners").select("id, name").order("name"),
    supabaseClient
      .from("rooms")
      .select("id, room_code, owner_id, tenant_name, usage_type, contract_start_date, contract_end_date, rent_start_date, deposit_amount, notes")
      .order("room_code"),
    supabaseClient
      .from("transactions")
      .select("id, room_id, tx_date, flow_type, item_name, amount, details, created_at")
      .order("tx_date", { ascending: false })
  ]);

  if (ownersError || roomsError || transactionsError) {
    throw ownersError || roomsError || transactionsError;
  }

  const ownerMap = new Map(owners.map((owner) => [owner.id, owner.name]));
  state.owners = owners;
  state.rooms = rooms.map((room) => ({
    ...room,
    owner_name: ownerMap.get(room.owner_id) || "-"
  }));
  state.transactions = transactions;

  const { data: maintenanceRules, error: maintenanceError } = await supabaseClient
    .from("maintenance_rules")
    .select("id, room_id, task_name, interval_months, lead_months, last_done_date, next_due_date, notes, active, created_at")
    .order("next_due_date", { ascending: true });

  if (maintenanceError) {
    state.maintenanceAvailable = false;
    state.maintenanceRules = [];
  } else {
    state.maintenanceAvailable = true;
    state.maintenanceRules = maintenanceRules || [];
  }

  if (state.year === ALL_YEARS) {
    state.year = getLatestTransactionYear();
  } else if (!getYearOptions().includes(state.year)) {
    state.year = ALL_YEARS;
  }

  resetMonthRangeForYear(state.year);

  ensureRentDraftSelection();
  buildRentDraft(getSelectedRentMonthValue());
  renderAll();
}

function renderPortfolioSummary() {
  const rooms = [...getRoomMetrics()].sort((a, b) => b.profit - a.profit);
  const summary = getSummary();

  portfolioSummary.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ห้อง</th>
            <th>เจ้าของ</th>
            <th>ผู้เช่า</th>
            <th>ค่ามัดจำ</th>
            <th>เริ่มสัญญา</th>
            <th>สิ้นสุดสัญญา</th>
            <th>เงินลงทุน</th>
            <th>ค่าเช่า</th>
            <th>ค่าเช่าเฉลี่ยต่อเดือน</th>
            <th>ค่าใช้จ่าย</th>
            <th>กำไรสุทธิ</th>
            <th>ROI</th>
          </tr>
        </thead>
        <tbody>
          ${rooms.map((room) => `
            <tr>
              <td>${room.roomCode}</td>
              <td>${room.owner}</td>
              <td>${escapeHtml(room.tenantName)}</td>
              <td>${formatOptionalCurrency(room.depositAmount)}</td>
              <td>${formatDateDisplay(room.contractStartDate)}</td>
              <td>${formatDateDisplay(room.contractEndDate)}</td>
              <td>${formatCurrency(room.capital)}</td>
              <td>${formatCurrency(room.rent)}</td>
              <td>${formatMoneyInput(room.averageMonthlyRent)}</td>
              <td>${formatCurrency(room.expense)}</td>
              <td>${formatCurrency(room.profit)}</td>
              <td>${room.roi}%</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td>Total</td>
            <td>${summary.rooms} ห้อง</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>${formatCurrency(summary.capital)}</td>
            <td>${formatCurrency(summary.rent)}</td>
            <td>${summary.averageMonthlyRent > 0 ? formatMoneyInput(summary.averageMonthlyRent) : "-"}</td>
            <td>${formatCurrency(summary.expense)}</td>
            <td>${formatCurrency(summary.profit)}</td>
            <td>${summary.roi}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderMetrics() {
  const summary = getSummary();
  const metrics = [
    { label: "กำไรสุทธิ", value: formatCurrency(summary.profit), foot: `ROI ${summary.roi}%` },
    { label: "ค่าเช่ารวม", value: formatCurrency(summary.rent), foot: `${summary.rooms} ห้องที่มีข้อมูล` },
    { label: "ค่าใช้จ่ายรวม", value: formatCurrency(summary.expense), foot: "ค่าใช้จ่ายรวมทุกรายการ" },
    { label: "มูลค่าลงทุน", value: formatCurrency(summary.capital), foot: `คิดเป็น ${formatCompact(summary.capital)}` }
  ];

  if (state.year !== ALL_YEARS && state.viewMode === "average") {
    metrics[0].foot = `ROI ${summary.roi}% จากทุนเฉลี่ย ${summary.monthCount} เดือน`;
    metrics[3].foot = `ทุนเฉลี่ย ${summary.monthCount} เดือน = ${formatCurrency(summary.averageCapital)}`;
  }

  if (state.year !== ALL_YEARS && state.viewMode === "fullYear") {
    metrics[0].foot = `ROI ${summary.roi}% แบบ Full Year`;
    metrics[3].foot = `ทุนเต็มปี = ${formatCurrency(summary.capital)}`;
  }

  metricGrid.innerHTML = metrics.map((metric) => `
    <article class="metric-card">
      <p class="eyebrow">${metric.label}</p>
      <h3>${metric.value}</h3>
      <p class="metric-foot">${metric.foot}</p>
    </article>
  `).join("");
}

function renderTable() {
  if (!roomTableBody) return;

  const rooms = [...getRoomMetrics()].sort((a, b) => b.profit - a.profit);
  const summary = getSummary();

  roomTableBody.innerHTML = `
    ${rooms.map((room) => `
      <tr>
        <td>${room.roomCode}</td>
        <td>${room.owner}</td>
        <td>${escapeHtml(room.tenantName)}</td>
        <td>${formatOptionalCurrency(room.depositAmount)}</td>
        <td>${formatDateDisplay(room.contractStartDate)}</td>
        <td>${formatDateDisplay(room.contractEndDate)}</td>
        <td>${formatCurrency(room.capital)}</td>
        <td>${formatCurrency(room.rent)}</td>
        <td>${formatMoneyInput(room.averageMonthlyRent)}</td>
        <td>${formatCurrency(room.expense)}</td>
        <td>${formatCurrency(room.profit)}</td>
        <td>${room.roi}%</td>
      </tr>
    `).join("")}
    <tr class="total-row">
      <td>Total</td>
      <td>${summary.rooms} ห้อง</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>${formatCurrency(summary.capital)}</td>
      <td>${formatCurrency(summary.rent)}</td>
      <td>${summary.averageMonthlyRent > 0 ? formatMoneyInput(summary.averageMonthlyRent) : "-"}</td>
      <td>${formatCurrency(summary.expense)}</td>
      <td>${formatCurrency(summary.profit)}</td>
      <td>${summary.roi}%</td>
    </tr>
  `;
}

function applyOverviewLabels() {
  const overviewPanels = document.querySelectorAll("#overview .panel-grid:first-of-type .panel h3");
  if (overviewPanels[0]) {
    overviewPanels[0].textContent = "ตารางสรุปรายห้อง";
  }
  if (overviewPanels[1]) {
    overviewPanels[1].textContent = "สรุปตามเจ้าของห้อง";
  }
}

function removeRoomsSection() {
  document.querySelector('.nav-link[data-section="rooms"]')?.remove();
  document.querySelector("#rooms")?.remove();
}

function renderManagementLists() {
  const selectedCapitalRoom = capitalRoom?.value || "";
  const capitalRows = getEnrichedTransactions()
    .filter((tx) => tx.flow_type === "capital")
    .filter((tx) => !selectedCapitalRoom || tx.roomCode === selectedCapitalRoom)
    .sort((a, b) => new Date(b.tx_date) - new Date(a.tx_date))
    .slice(0, 20);

  const selectedExpenseRoom = expenseRoom?.value || "";
  const expenseRows = getFilteredTransactions()
    .filter((tx) => tx.flow_type === "expense")
    .filter((tx) => !selectedExpenseRoom || tx.roomCode === selectedExpenseRoom)
    .sort((a, b) => new Date(b.tx_date) - new Date(a.tx_date))
    .slice(0, 20);

  capitalDeleteList.innerHTML = capitalRows.map((tx) => `
    <article class="management-item">
      <div>
        <strong>${tx.roomCode} • ${formatCurrency(tx.amount)}</strong>
        <p class="subtext">${tx.item_name || "ทุน"} • ${tx.tx_date}${tx.details ? ` • ${tx.details}` : ""}</p>
      </div>
      <button type="button" class="danger-button" data-capital-id="${tx.id}" data-capital-room="${tx.roomCode}">ลบทุน</button>
    </article>
  `).join("") || `<article class="management-item"><div><strong>ยังไม่มีรายการทุน</strong><p class="subtext">รายการนี้จะอิงตามห้องที่เลือกด้านบน</p></div></article>`;

  expenseDeleteList.innerHTML = expenseRows.map((tx) => `
    <article class="management-item">
      <div>
        <strong>${tx.roomCode} • ${formatCurrency(tx.amount)}</strong>
        <p class="subtext">${tx.tx_date}${tx.details ? ` • ${tx.details}` : ""}</p>
      </div>
      <button type="button" class="danger-button" data-expense-id="${tx.id}" data-expense-room="${tx.roomCode}">ลบค่าใช้จ่าย</button>
    </article>
  `).join("") || `<article class="management-item"><div><strong>ยังไม่มีค่าใช้จ่าย</strong><p class="subtext">รายการนี้จะอิงตามห้องที่เลือกและปีข้อมูลด้านบน</p></div></article>`;

  roomDeleteList.innerHTML = state.rooms
    .slice()
    .sort((a, b) => a.room_code.localeCompare(b.room_code))
    .map((room) => `
      <article class="management-item management-item-room">
        <div>
          <strong>${room.room_code}</strong>
          <div class="room-meta-list">
            <p class="subtext">เจ้าของปัจจุบัน: ${escapeHtml(room.owner_name)}</p>
            <p class="subtext">การใช้งาน: ${room.usage_type === "owner_use" ? "อยู่เอง" : "ปล่อยเช่า"}</p>
            <p class="subtext">ผู้เช่า: ${escapeHtml(room.tenant_name || "-")}</p>
            <p class="subtext">สัญญา: ${formatContractRange(room.contract_start_date, room.contract_end_date)}</p>
            <p class="subtext">เริ่มปล่อยเช่า: ${isRentalRoom(room) && room.rent_start_date ? formatMonthLabel(monthKeyFromDate(room.rent_start_date)) : "-"}</p>
            <p class="subtext">ค่ามัดจำ: ${formatOptionalCurrency(room.deposit_amount)}</p>
          </div>
        </div>
        <div class="management-room-editor">
          <label>
            เจ้าของห้อง
            <select data-room-owner-select="${room.id}">
              ${state.owners
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((owner) => `<option value="${owner.id}" ${owner.id === room.owner_id ? "selected" : ""}>${owner.name}</option>`)
                .join("")}
            </select>
          </label>
          <label>
            ชื่อผู้เช่า
            <input type="text" data-room-tenant-input="${room.id}" value="${escapeHtml(room.tenant_name || "")}" placeholder="เช่น คุณสมชาย">
          </label>
          <label>
            การใช้งานห้อง
            <select data-room-usage-type="${room.id}">
              <option value="rental" ${(room.usage_type || "rental") === "rental" ? "selected" : ""}>ปล่อยเช่า</option>
              <option value="owner_use" ${(room.usage_type || "rental") === "owner_use" ? "selected" : ""}>อยู่เอง</option>
            </select>
          </label>
          <label>
            วันเริ่มสัญญา
            <input type="text" inputmode="numeric" data-room-contract-start="${room.id}" value="${formatDateInput(room.contract_start_date || "")}" placeholder="วว/ดด/ปปปป">
          </label>
          <label>
            วันสิ้นสุดสัญญา
            <input type="text" inputmode="numeric" data-room-contract-end="${room.id}" value="${formatDateInput(room.contract_end_date || "")}" placeholder="วว/ดด/ปปปป">
          </label>
          <label>
            เดือนเริ่มปล่อยเช่า
            <input type="month" data-room-rent-start="${room.id}" value="${formatMonthInput(room.rent_start_date || "")}">
          </label>
          <label>
            ค่ามัดจำ
            <input type="number" step="0.01" inputmode="decimal" data-room-deposit="${room.id}" value="${room.deposit_amount ?? ""}" placeholder="เช่น 13000">
          </label>
          <label>
            หมายเหตุ
            <input type="text" data-room-notes-input="${room.id}" value="${escapeHtml(room.notes || "")}" placeholder="รายละเอียดเพิ่มเติม">
          </label>
          <div class="button-row">
            <button type="button" class="secondary-button" data-room-update="${room.id}" data-room-code="${room.room_code}">บันทึกข้อมูลห้อง</button>
            <button type="button" class="danger-button" data-room-id="${room.id}" data-room-code="${room.room_code}">ลบห้อง</button>
          </div>
        </div>
      </article>
    `).join("");

  ownerDeleteList.innerHTML = state.owners
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((owner) => {
      const roomCount = state.rooms.filter((room) => room.owner_id === owner.id).length;
      return `
        <article class="management-item">
          <div>
            <strong>${owner.name}</strong>
            <p class="subtext">${roomCount} ห้องในระบบ</p>
          </div>
          <button type="button" class="danger-button" data-owner-id="${owner.id}" data-owner-name="${owner.name}">ลบเจ้าของห้อง</button>
        </article>
      `;
    }).join("");
}

function bindRoomOwnerUpdates() {
  roomDeleteList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.roomUpdate) return;

    const roomId = target.dataset.roomUpdate;
    const roomCode = target.dataset.roomCode || "";
    const ownerSelect = roomDeleteList.querySelector(`[data-room-owner-select="${roomId}"]`);
    const tenantInput = roomDeleteList.querySelector(`[data-room-tenant-input="${roomId}"]`);
    const usageTypeInput = roomDeleteList.querySelector(`[data-room-usage-type="${roomId}"]`);
    const contractStartInput = roomDeleteList.querySelector(`[data-room-contract-start="${roomId}"]`);
    const contractEndInput = roomDeleteList.querySelector(`[data-room-contract-end="${roomId}"]`);
    const rentStartInput = roomDeleteList.querySelector(`[data-room-rent-start="${roomId}"]`);
    const depositInput = roomDeleteList.querySelector(`[data-room-deposit="${roomId}"]`);
    const notesInput = roomDeleteList.querySelector(`[data-room-notes-input="${roomId}"]`);
    if (!(ownerSelect instanceof HTMLSelectElement)) return;
    if (!(tenantInput instanceof HTMLInputElement)) return;
    if (!(usageTypeInput instanceof HTMLSelectElement)) return;
    if (!(contractStartInput instanceof HTMLInputElement)) return;
    if (!(contractEndInput instanceof HTMLInputElement)) return;
    if (!(rentStartInput instanceof HTMLInputElement)) return;
    if (!(depositInput instanceof HTMLInputElement)) return;
    if (!(notesInput instanceof HTMLInputElement)) return;

    const ownerId = ownerSelect.value;
    const ownerName = ownerSelect.options[ownerSelect.selectedIndex]?.textContent || "-";
    const tenantName = tenantInput.value.trim();
    const usageType = usageTypeInput.value.trim() || "rental";
    const contractStartDate = parseDateInput(contractStartInput.value.trim());
    const contractEndDate = parseDateInput(contractEndInput.value.trim());
    const rentStartDate = parseMonthInput(rentStartInput.value.trim());
    const depositRaw = depositInput.value.trim();
    const depositAmount = depositRaw === "" ? null : Number(depositRaw);
    const notes = notesInput.value.trim();

    if (contractStartDate === null || contractEndDate === null) {
      alert("กรุณากรอกวันที่เป็นรูปแบบ วัน/เดือน/ปี");
      return;
    }

    if (rentStartDate === null) {
      alert("กรุณาเลือกเดือนเริ่มปล่อยเช่าให้ถูกต้อง");
      return;
    }

    if (!["rental", "owner_use"].includes(usageType)) {
      alert("กรุณาเลือกการใช้งานห้องให้ถูกต้อง");
      return;
    }

    if (depositRaw !== "" && (Number.isNaN(depositAmount) || depositAmount < 0)) {
      alert("กรุณากรอกค่ามัดจำให้ถูกต้อง");
      return;
    }

    if (contractStartDate && contractEndDate && contractStartDate > contractEndDate) {
      alert("วันสิ้นสุดสัญญาต้องไม่น้อยกว่าวันเริ่มสัญญา");
      return;
    }

    const confirmed = window.confirm(`บันทึกข้อมูลห้อง ${roomCode} ใช่หรือไม่?`);
    if (!confirmed) return;

    try {
      const { error } = await supabaseClient.from("rooms").update({
        owner_id: ownerId,
        tenant_name: tenantName || null,
        usage_type: usageType,
        contract_start_date: contractStartDate || null,
        contract_end_date: contractEndDate || null,
        rent_start_date: usageType === "rental" ? (rentStartDate || null) : null,
        deposit_amount: depositAmount,
        notes: notes || null
      }).eq("id", roomId);
      if (error) throw error;
      alert(`บันทึกข้อมูลห้อง ${roomCode} เรียบร้อย`);
      await loadDashboardData();
    } catch (error) {
      alert(`บันทึกข้อมูลห้องไม่สำเร็จ: ${error.message}`);
    }
  });
}

async function init() {
  removeRoomsSection();
  reorderOverviewPanels();
  applyOverviewLabels();
  bindNavigation();
  bindEntryTabs();
  setEntryTab(state.entryTab);
  bindFilters();
  bindExpenseRecurringToggle();
  bindExpenseDeleteFilters();
  bindRentDraft();
  bindCapitalForm();
  bindRoomForm();
  bindRoomModal();
  bindOwnerForm();
  bindOwnerModal();
  bindManagementDeletes();
  bindRoomOwnerUpdates();
  bindExpenseForm();

  try {
    await loadDashboardData();
  } catch (error) {
    showError(error.message);
  }
}

init();
