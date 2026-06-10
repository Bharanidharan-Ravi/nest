export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];
export const HOURS = Array.from({ length: 9 }, (_, i) => i + 10);

// export const EMPLOYEES = [
//   "AnbuMani","Gowtham","Akash","Rekha","RamKumar",
//   "BharaniDharan","Sandhiya","Povannan","Nandhini N",
//   "Rathidevi","Daanimalayan","Testuser",
// ];

// export const CLIENTS = [
//   "Poovannan","Zaheer","Tarzan","Ram","Joe",
//   "Raja","Prabhu","Pink","Rogers","Test",
// ];

export const AVAILABILITY_TYPES = ["Available", "Leave", "Vacation", "WFH"];

export const MEETING_TYPES = ["Internal", "Client"];

export const STATUS_TYPES = ["Organized", "Disbanded", "Completed"];

export const AVAILABILITY_TYPE_COLOR = {
  Available : "bg-emerald-600",
  Leave     : "bg-red-500",
  Vacation  : "bg-orange-500",
  WFH       : "bg-blue-500",
};

export const AVAILABILITY_BLOCK_COLOR = {
  Available : "bg-emerald-50 border-l-4 border-emerald-400 text-emerald-800",
  Leave     : "bg-red-50 border-l-4 border-red-400 text-red-800",
  Vacation  : "bg-orange-50 border-l-4 border-orange-400 text-orange-800",
  WFH       : "bg-blue-50 border-l-4 border-blue-400 text-blue-800",
};
