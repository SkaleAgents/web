const toDate = (value: string | number | Date) => new Date(value);

export const formatDateTime = (value: string | number | Date) => toDate(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
export const formatDate = (value: string | number | Date) => toDate(value).toLocaleDateString(undefined, { dateStyle: "medium" });
