export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  // Ensure UTC string parses properly
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0) {
    // Future date (Scheduled)
    const futureSec = Math.abs(diffInSeconds);
    if (futureSec < 60) return 'In a few seconds';
    if (futureSec < 3600) return `In ${Math.floor(futureSec / 60)} minutes`;
    if (futureSec < 86400) return `In ${Math.floor(futureSec / 3600)} hours`;
    return `In ${Math.floor(futureSec / 86400)} days`;
  }

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffInSeconds < 172800) return 'Yesterday';
  
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 30) return `${days} days ago`;
  
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Not specified';
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatToInputDateTime(dateString?: string | null): string {
  if (!dateString) return '';
  const d = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  if (isNaN(d.getTime())) return '';
  
  // Format as YYYY-MM-DDTHH:mm in local time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
