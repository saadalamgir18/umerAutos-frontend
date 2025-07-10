import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from "@/lib/api";

interface CompatibleModel {
  id: number;
  name: string;
}

interface CompatibleModelState {
  items: CompatibleModel[];
  loading: boolean;
  error: string | null;
}

const initialState: CompatibleModelState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCompatibleModels = createAsyncThunk(
  'compatibleModel/fetchCompatibleModels',
  async () => {
    const response = await fetch(`${API_URL}/api/v1/compatible-models`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch compatible models');
    }
    return response.json();
  }
);

export const addCompatibleModel = createAsyncThunk(
  'compatibleModel/addCompatibleModel',
  async (model: { name: string }) => {
    const response = await fetch(`${API_URL}/api/v1/compatible-models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(model),
    });
    if (!response.ok) {
      throw new Error('Failed to add compatible model');
    }
    return response.json();
  }
);

export const updateCompatibleModel = createAsyncThunk(
  'compatibleModel/updateCompatibleModel',
  async ({ id, name }: { id: number; name: string }) => {
    const response = await fetch(`${API_URL}/api/v1/compatible-models/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      throw new Error('Failed to update compatible model');
    }
    return response.json();
  }
);

export const deleteCompatibleModel = createAsyncThunk(
  'compatibleModel/deleteCompatibleModel',
  async (id: number) => {
    const response = await fetch(`${API_URL}/api/v1/compatible-models/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to delete compatible model');
    }
    return id;
  }
);

const compatibleModelSlice = createSlice({
  name: 'compatibleModel',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompatibleModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompatibleModels.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCompatibleModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch compatible models';
      })
      .addCase(addCompatibleModel.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateCompatibleModel.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteCompatibleModel.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export default compatibleModelSlice.reducer; 