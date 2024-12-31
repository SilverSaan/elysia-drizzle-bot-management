// src/errors/exceptions.ts

export class ConflictError extends Error {
    constructor(public message: string) {
        super(message);
        this.name = 'ConflictError'; // Set the error name to distinguish it
    }
}
