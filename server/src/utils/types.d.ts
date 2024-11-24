import mongoose, {Document} from "mongoose";

export interface ServerResponse<T>{
    isSuccessful: boolean;               // האם הבקשה הצליחה
    displayMessage: string | null;       // הודעה למשתמש
    description: string | null;          // תיאור נוסף (אם קיים)
    exception: string | null;            // תיאור החריגה (אם קרתה שגיאה)
    data: T | null;                      // כל המידע הקשור לבקשה
}