export function numberValue(id: string): number {

    const input = document.getElementById(id) as HTMLInputElement | null;

    if (!input) return 0;

    return Number(input.value);

}