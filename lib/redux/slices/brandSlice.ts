import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from "@/lib/api";

interface Brand {
  id: string;
  name: string;
  description: string;
}

interface BrandState {
  items: Brand[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: BrandState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchBrands = createAsyncThunk('brands/fetchBrands', async () => {
  const response = await fetch(`${API_URL}/api/v1/brands`, {credentials: 'include'});
  if (!response.ok) {
    throw new Error('Failed to fetch brands');
  }
  return response.json();
});

export const addBrand = createAsyncThunk('brands/addBrand', async (brand: { name: string }) => {
  const response = await fetch(`${API_URL}/api/v1/brands`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(brand),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to add brand');
  }
  return response.json();
});

export const updateBrand = createAsyncThunk('brands/updateBrand', async (brand: Brand) => {
  const response = await fetch(`${API_URL}/api/v1/brands/${brand.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(brand),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to update brand');
  }
  return response.json();
});

export const deleteBrand = createAsyncThunk('brands/deleteBrand', async (id: string) => {
  const response = await fetch(`${API_URL}/api/v1/brands/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete brand');
  }
  return id;
});

const brandSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch brands';
      })
      .addCase(addBrand.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
        const index = state.items.findIndex((brand) => brand.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteBrand.fulfilled, (state, action) => {
        state.items = state.items.filter((brand) => brand.id !== action.payload);
      });
  },
});

export default brandSlice.reducer; 