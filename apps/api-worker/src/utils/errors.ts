export class ApiError extends Error {
    constructor(
        public message: string,
        public statusCode: number,
        public code: string,
        public details?: Record<string, any>
    ) {
        super(message);
        this.name = 'ApiError';
    }

    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                statusCode: this.statusCode,
                ...(this.details && { details: this.details }),
            },
        };
    }
}

export const errorHandler = (error: any) => {
    if (error instanceof ApiError) {
        return new Response(JSON.stringify(error.toJSON()), {
            status: error.statusCode,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Generic server error
    console.error('Unhandled error:', error);
    return new Response(
        JSON.stringify({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An internal server error occurred',
                statusCode: 500,
            },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
};
