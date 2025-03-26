export interface IResponse {
    isSuccessful: boolean;
    displayMessage: string | null;
    description: string | null;
    exception: string | null;
    data: Object | null;
}