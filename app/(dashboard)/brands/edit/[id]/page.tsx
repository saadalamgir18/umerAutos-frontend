'use client';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { updateBrand } from '@/lib/redux/slices/brandSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

const EditBrandPage = ({ params }: { params: { id: string } }) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const brand = useSelector((state: RootState) => state.brands.items.find((b) => b.id === params.id));
  const [name, setName] = useState(brand?.name || '');
  const [description, setDescription] = useState(brand?.description || '');

  useEffect(() => {
    if (!brand) {
      router.push('/brands');
    }
  }, [brand, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateBrand({ id: params.id, name, description }));
    router.push('/brands');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Brand</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <Button type="submit">Update Brand</Button>
      </form>
    </div>
  );
};

export default EditBrandPage; 