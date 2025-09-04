import mongoose from 'mongoose';
import Category from './models/Category.js';
import Subcategory from './models/Subcategory.js';

async function createSubcategories() {
  try {
    await mongoose.connect('mongodb://localhost:27017/MARK-LIGHT-LTD');
    
    console.log('Getting categories...');
    const categories = await Category.find();
    console.log('Categories found:', categories.map(c => ({ id: c._id, name: c.name })));
    
    // Find specific categories
    const chandeliers = categories.find(c => c.name === 'Люстри');
    const tableLamps = categories.find(c => c.name === 'Настолни лампи');
    const ledLighting = categories.find(c => c.name === 'LED осветление');
    
    // Create subcategories for Chandeliers
    if (chandeliers) {
      await Subcategory.create([
        {
          name: 'Кристални люстри',
          description: 'Луксозни кристални люстри',
          category: chandeliers._id,
          isActive: true,
          sortOrder: 1
        },
        {
          name: 'Модерни люстри',
          description: 'Съвременни дизайнерски люстри',
          category: chandeliers._id,
          isActive: true,
          sortOrder: 2
        },
        {
          name: 'Класически люстри',
          description: 'Традиционни и винтидж люстри',
          category: chandeliers._id,
          isActive: true,
          sortOrder: 3
        }
      ]);
      console.log('Created subcategories for Люстри');
    }
    
    // Create subcategories for Table Lamps
    if (tableLamps) {
      await Subcategory.create([
        {
          name: 'Офис лампи',
          description: 'Настолни лампи за работно място',
          category: tableLamps._id,
          isActive: true,
          sortOrder: 1
        },
        {
          name: 'Нощни лампи',
          description: 'Лампи за спалня и нощно осветление',
          category: tableLamps._id,
          isActive: true,
          sortOrder: 2
        },
        {
          name: 'Декоративни лампи',
          description: 'Дизайнерски настолни лампи',
          category: tableLamps._id,
          isActive: true,
          sortOrder: 3
        }
      ]);
      console.log('Created subcategories for Настолни лампи');
    }
    
    // Create subcategories for LED Lighting
    if (ledLighting) {
      await Subcategory.create([
        {
          name: 'LED панели',
          description: 'Таванни LED панели',
          category: ledLighting._id,
          isActive: true,
          sortOrder: 1
        },
        {
          name: 'LED ленти',
          description: 'Гъвкави LED ленти за декорация',
          category: ledLighting._id,
          isActive: true,
          sortOrder: 2
        },
        {
          name: 'Smart LED',
          description: 'Интелигентно LED осветление',
          category: ledLighting._id,
          isActive: true,
          sortOrder: 3
        }
      ]);
      console.log('Created subcategories for LED осветление');
    }
    
    console.log('Subcategories created successfully!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

createSubcategories();
