import React from 'react';

const AssigneesWidget = ({ assigneesJson }) => {
  // 1. Safely parse the JSON string coming from the SQL Stored Procedure
  let assignees = [];
  try {
    assignees = assigneesJson ? JSON.parse(assigneesJson) : [];
  } catch (error) {
    console.error("Failed to parse assignees", error);
  }

  return (
    <div className="bg-white p-4 rounded-md border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
        Assignees ({assignees.length})
      </h3>
      
      {assignees.length === 0 ? (
        <span className="text-sm text-gray-500">No one assigned</span>
      ) : (
        <ul className="flex flex-col gap-3">
          {assignees.map((user) => (
            <li key={user.Assignee_Id} className="flex items-center gap-3">
              
              {/* Avatar Placeholder (Use real images if you have them) */}
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                {user.Assignee_Name.charAt(0).toUpperCase()}
              </div>
              
              {/* Name and Role */}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">
                  {user.Assignee_Name}
                </span>
                <span className={`text-xs ${user.Assignment_Type === 'Main Assignee' ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                  {user.Assignment_Type}
                </span>
              </div>
              
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AssigneesWidget;