"use client";

import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { InventarioItemComponent } from "./inventario-item";
import { InventarioItem } from "@/lib/types";
import { Plus, ClipboardList, Lightbulb } from "lucide-react";

interface InventarioSectionProps {
  inventario: InventarioItem[];
  onChange: (inventario: InventarioItem[]) => void;
}

export function InventarioSection({ inventario = [], onChange }: InventarioSectionProps) {
  const [showTips, setShowTips] = useState(false);

  // Create a new item with default values
  const criarNovoItem = (): InventarioItem => ({
    item: "",
    descricao: "",
    quantidade: 1,
    condicao: "NOVA",
    valorEstimado: 0,
    observacoes: "",
  });

  // Add a new item to the inventory
  const adicionarItem = () => {
    onChange([...inventario, criarNovoItem()]);
  };

  // Update a specific item in the inventory
  const atualizarItem = (index: number, itemAtualizado: InventarioItem) => {
    const novosItens = [...inventario];
    novosItens[index] = itemAtualizado;
    onChange(novosItens);
  };

  // Remove an item from the inventory
  const removerItem = (index: number) => {
    const novosItens = [...inventario];
    novosItens.splice(index, 1);
    onChange(novosItens);
  };

  // Calculate total value of inventory
  const valorTotalInventario = inventario.reduce(
    (total, item) => total + (item.valorEstimado * item.quantidade), 0
  );

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl shadow-md overflow-hidden mt-6">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 flex justify-between items-center">
        <div className="flex items-center text-white">
          <ClipboardList className="h-6 w-6 mr-3" />
          <h3 className="font-bold text-lg">Inventário do Imóvel</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setShowTips(!showTips)}
            variant="ghost" 
            size="sm"
            className="text-white hover:bg-emerald-700 rounded-full p-2 h-auto w-auto"
          >
            <Lightbulb className="h-5 w-5" />
          </Button>
          <div className="bg-white text-emerald-800 rounded-lg px-3 py-1 text-sm font-medium">
            {inventario.length} {inventario.length === 1 ? 'item' : 'itens'}
          </div>
        </div>
      </div>
      
      {showTips && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-400">
          <h4 className="font-medium text-amber-800 mb-1">Dicas para o inventário</h4>
          <ul className="text-sm text-amber-700 list-disc ml-5 space-y-1">
            <li>Adicione todos os itens disponíveis para os hóspedes</li>
            <li>Registre o estado atual de cada item para evitar problemas futuros</li>
            <li>Itens valiosos devem ter valor estimado e descrição detalhada</li>
            <li>Fotos dos itens podem ser anexadas nas observações</li>
          </ul>
        </div>
      )}
      
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            Adicione os itens que fazem parte do imóvel e que estarão disponíveis para os hóspedes.
          </p>
          
          {valorTotalInventario > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-500">Valor total estimado:</span>
              <p className="text-emerald-700 font-medium">
                R$ {valorTotalInventario.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>
          )}
        </div>

        {inventario.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50 bg-opacity-50">
            <div className="inline-block p-3 bg-emerald-100 rounded-full mb-3">
              <ClipboardList className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-gray-600 mb-4">Nenhum item adicionado ao inventário</p>
            <Button 
              onClick={adicionarItem} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar Primeiro Item
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {inventario.map((item, index) => (
                <InventarioItemComponent
                  key={index}
                  item={item}
                  onChange={(itemAtualizado) => atualizarItem(index, itemAtualizado)}
                  onRemove={() => removerItem(index)}
                  index={index}
                />
              ))}
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                onClick={adicionarItem} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2"
              >
                <Plus className="h-5 w-5 mr-2" /> Adicionar Novo Item
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
