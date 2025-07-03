import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface ShelfCode {
  id: number;
  code: string;
}

interface ShelfCodeState {
  items: ShelfCode[];
  loading: boolean;
  error: string | null;
}

const initialState: ShelfCodeState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchShelfCodes = createAsyncThunk(
  'shelfCode/fetchShelfCodes',
  async () => {
    const response = await fetch('http://localhost:8083/api/v1/shelf', {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch shelf codes');
    }
    return response.json();
  }
);

export const addShelfCode = createAsyncThunk(
  'shelfCode/addShelfCode',
  async (code: { code: string }) => {
    const response = await fetch('http://localhost:8083/api/v1/shelf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify( {name: code}),
    });
    if (!response.ok) {
      throw new Error('Failed to add shelf code');
    }
    return response.json();
  }
);

export const updateShelfCode = createAsyncThunk(
  'shelfCode/updateShelfCode',
  async ({ id, code }: { id: number; code: string }) => {
    const response = await fetch(`http://localhost:8083/api/v1/shelf/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      throw new Error('Failed to update shelf code');
    }
    return response.json();
  }
);

export const deleteShelfCode = createAsyncThunk(
  'shelfCode/deleteShelfCode',
  async (id: number) => {
    const response = await fetch(`http://localhost:8083/api/v1/shelf/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to delete shelf code');
    }
    return id;
  }
);

const shelfCodeSlice = createSlice({
  name: 'shelfCode',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShelfCodes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShelfCodes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchShelfCodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch shelf codes';
      })
      .addCase(addShelfCode.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateShelfCode.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteShelfCode.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export default shelfCodeSlice.reducer; 