import { z } from 'zod';

// Order form validation
export const orderFormSchema = z.object({
    quantity: z.number({
        required_error: 'Quantity is required',
        invalid_type_error: 'Quantity must be a number',
    }).positive('Quantity must be positive').max(1000, 'Quantity too large'),
    price: z.number({
        invalid_type_error: 'Price must be a number',
    }).positive('Price must be positive').optional(),
}).refine((data) => {
    // Price validation will be done based on order type in component
    return true;
});

export type OrderFormInput = z.infer<typeof orderFormSchema>;
