import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

interface DateState {
    dailyDate: Date | null;
    loading: boolean;
    error: string | null;
}

const initialState: DateState = {
    dailyDate: null,
    loading: false,
    error: null,
};

export const fetchDailyDate = createAsyncThunk(
    'date/fetchDailyDate',
    async (_, { rejectWithValue }) => {
        const response = await apiService.getDailyDate();
        if (response.error) {
            return rejectWithValue(response.error);
        }
        return response.data?.dailyDate || null;
    }
);

const dateSlice = createSlice({
    name: 'date',
    initialState,
    reducers: {
        clearDateError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDailyDate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDailyDate.fulfilled, (state, action) => {
                state.loading = false;
                state.dailyDate = action.payload;
                state.error = null;
            })
            .addCase(fetchDailyDate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to fetch daily date';
            });
    },
});

export const { clearDateError } = dateSlice.actions;

export default dateSlice.reducer;