const isFilled = (value) => {
  if (Array.isArray(value)) {
    return value.some((item) => isFilled(item));
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return value !== undefined && value !== null;
};

const getMissingProfileFields = (student = {}) => {
  const missingFields = [];

  if (!isFilled(student.name)) {
    missingFields.push("name");
  }

  if (!isFilled(student.email)) {
    missingFields.push("email");
  }

  if (!isFilled(student.phone)) {
    missingFields.push("phone");
  }

  if (!isFilled(student.department)) {
    missingFields.push("department");
  }

  if (!isFilled(student.skills)) {
    missingFields.push("skills");
  }

  if (!isFilled(student.cgpa)) {
    missingFields.push("cgpa");
  }

  if (!isFilled(student.passingYear)) {
    missingFields.push("passingYear");
  }

  if (!isFilled(student.address)) {
    missingFields.push("address");
  }

  return missingFields;
};

const getProfileStatus = (student) => {
  const missingFields = getMissingProfileFields(student);

  return {
    complete: missingFields.length === 0,
    missingFields,
    hasResume: Boolean(student?.resume?.path)
  };
};

module.exports = {
  getProfileStatus,
  getMissingProfileFields
};
