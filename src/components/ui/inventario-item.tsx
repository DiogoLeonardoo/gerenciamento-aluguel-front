"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { InventarioItem, CondicaoItem } from "@/lib/types";
import { Trash2, ChevronDown, ChevronUp, Package } from "lucide-react";

interface InventarioItemProps {
  item: InventarioItem;
  onChange: (item: InventarioItem) => void;
  onRemove: () => void;
  index: number;
}

export function InventarioItemComponent({
  item,
  onChange,
  onRemove,
  index,
}: InventarioItemProps) {
  const [expanded, setExpanded] = useState(false);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    let newValue: string | number = value;

    // Convert numeric fields
    if (name === "quantidade") {
      newValue = parseInt(value) || 1;
    } else if (name === "valorEstimado") {
      newValue = parseFloat(value) || 0;
    }

    onChange({
      ...item,
      [name]: newValue,
    });
  };
  
  // Get the badge color based on condition
  const getConditionBadge = (condition: string) => {
    switch(condition) {
      case 'NOVA': 
        return "bg-green-100 text-green-800 border-green-200";
      case 'USADA': 
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'DESGASTADA': 
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  // Format the condition text
  const formatCondition = (condition: string) => {
    const map = {
      'NOVA': 'Nova',
      'USADA': 'Usada',
      'DESGASTADA': 'Desgastada'
    };
    return map[condition as keyof typeof map] || condition;
  };

  return (
    <div className="mb-4 overflow-hidden transition-all duration-300 rounded-lg shadow-md hover:shadow-lg bg-white border border-emerald-100">
      <div 
        className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <Package className="h-5 w-5" />
          <h4 className="font-medium">{item.item || `Item ${index + 1}`}</h4>
          {item.quantidade > 1 && (
            <span className="bg-white bg-opacity-20 text-white px-2 py-0.5 rounded-full text-xs">
              Qtd: {item.quantidade}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getConditionBadge(item.condicao)}`}>
            {formatCondition(item.condicao)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-white hover:text-red-100 hover:bg-red-500 p-1 h-8 w-8 rounded-full"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>

      <div className={`p-4 border-t border-emerald-100 ${expanded ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label htmlFor={`item-${index}`} className="block text-sm font-medium mb-1 text-gray-700">
              Nome do Item *
            </label>
            <Input
              id={`item-${index}`}
              name="item"
              value={item.item}
              onChange={handleChange}
              placeholder="Ex: TV, Sofá, Cama"
              className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label htmlFor={`quantidade-${index}`} className="block text-sm font-medium mb-1 text-gray-700">
              Quantidade *
            </label>
            <Input
              id={`quantidade-${index}`}
              name="quantidade"
              type="number"
              min={1}
              value={item.quantidade}
              onChange={handleChange}
              className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor={`descricao-${index}`} className="block text-sm font-medium mb-1 text-gray-700">
            Descrição
          </label>
          <textarea
            id={`descricao-${index}`}
            name="descricao"
            value={item.descricao || ""}
            onChange={handleChange}
            className="w-full rounded-md border border-emerald-200 bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            placeholder="Descreva o item"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label htmlFor={`condicao-${index}`} className="block text-sm font-medium mb-1 text-gray-700">
              Condição *
            </label>
            <select
              id={`condicao-${index}`}
              name="condicao"
              value={item.condicao}
              onChange={handleChange}
              className="w-full rounded-md border border-emerald-200 bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              required
            >
              <option value="NOVA">Nova</option>
              <option value="USADA">Usada</option>
              <option value="DESGASTADA">Desgastada</option>
            </select>
          </div>
          <div>
            <label htmlFor={`valorEstimado-${index}`} className="block text-sm font-medium mb-1 text-gray-700">
              Valor Estimado (R$)
            </label>
            <Input
              id={`valorEstimado-${index}`}
              name="valorEstimado"
              type="number"
              min={0}
              step={0.01}
              value={item.valorEstimado}
              onChange={handleChange}
              className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor={`observacoes-${index}`} className="block text-sm font-medium mb-1 text-gray-700">
            Observações
          </label>
          <textarea
            id={`observacoes-${index}`}
            name="observacoes"
            value={item.observacoes || ""}
            onChange={handleChange}
            className="w-full rounded-md border border-emerald-200 bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            placeholder="Observações adicionais sobre o item"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
