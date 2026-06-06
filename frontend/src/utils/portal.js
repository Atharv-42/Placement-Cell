export const formatPackage = (job) => {
  if (job?.packageText) {
    return job.packageText;
  }

  if (job?.package) {
    return `${job.package} LPA`;
  }

  return "Package on request";
};

export const formatDate = (value, options = {}) => {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options
  });
};

export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const roleHome = {
  student: "/student",
  company: "/company",
  admin: "/admin"
};
