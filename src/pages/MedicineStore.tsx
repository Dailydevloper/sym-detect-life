
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Search, Plus, Minus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const MedicineStore = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: medicines, isLoading } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: cart } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          medicines (*)
        `)
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ medicineId, quantity }: { medicineId: string; quantity: number }) => {
      const { data, error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user?.id,
          medicine_id: medicineId,
          quantity
        }, {
          onConflict: 'user_id,medicine_id'
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: "Added to cart",
        description: "Item added successfully"
      });
    }
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ medicineId, quantity }: { medicineId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user?.id)
          .eq('medicine_id', medicineId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('user_id', user?.id)
          .eq('medicine_id', medicineId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  const filteredMedicines = medicines?.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCartQuantity = (medicineId: string) => {
    const item = cart?.find(item => item.medicine_id === medicineId);
    return item?.quantity || 0;
  };

  const getTotalPrice = () => {
    return cart?.reduce((total, item) => total + (item.medicines.price * item.quantity), 0) || 0;
  };

  const handleAddToCart = (medicineId: string) => {
    const currentQuantity = getCartQuantity(medicineId);
    addToCartMutation.mutate({ medicineId, quantity: currentQuantity + 1 });
  };

  const handleUpdateQuantity = (medicineId: string, newQuantity: number) => {
    updateCartMutation.mutate({ medicineId, quantity: newQuantity });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Medicine Store
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Order medicines with secure delivery to your doorstep
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Card className="ml-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">
                  {cart?.length || 0} items - ${getTotalPrice().toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMedicines?.map((medicine) => {
              const quantity = getCartQuantity(medicine.id);
              return (
                <Card key={medicine.id} className="overflow-hidden">
                  <div className="h-48 bg-gray-100 dark:bg-gray-800 relative">
                    <img
                      src={medicine.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'}
                      alt={medicine.name}
                      className="w-full h-full object-cover"
                    />
                    {medicine.requires_prescription && (
                      <Badge className="absolute top-2 right-2 bg-red-500">
                        Prescription Required
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{medicine.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {medicine.description}
                    </p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-2xl font-bold text-green-600">
                        ${medicine.price}
                      </span>
                      <Badge variant="outline">
                        {medicine.category}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-500 mb-3">
                      Stock: {medicine.stock_quantity} | by {medicine.manufacturer}
                    </p>

                    {quantity > 0 ? (
                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateQuantity(medicine.id, quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="mx-3 font-medium">{quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateQuantity(medicine.id, quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleAddToCart(medicine.id)}
                        disabled={medicine.stock_quantity === 0}
                        className="w-full"
                      >
                        {medicine.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineStore;
