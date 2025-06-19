'use client';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addBrand } from '@/lib/redux/slices/brandSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { AppDispatch } from '@/lib/redux/store';

const AddBrandPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addBrand({ name }));
    router.push('/brands');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add Brand</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <Button type="submit">Add Brand</Button>
      </form>
    </div>
  );
};

export default AddBrandPage; 