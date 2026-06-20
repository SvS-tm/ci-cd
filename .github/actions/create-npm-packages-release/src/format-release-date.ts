const pad = (value: any) => 
    String(value).padStart(2, "0");

export function formatReleaseDate(date = new Date()) 
{
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hour = pad(date.getUTCHours());
    const minute = pad(date.getUTCMinutes());

    return `${year}.${month}.${day}-${hour}_${minute}`;
}
