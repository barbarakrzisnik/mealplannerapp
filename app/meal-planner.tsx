'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Edit, Share2 } from 'lucide-react'

type Ingredient = {
  name: string
  quantity: number
  unit: string
  category: string
}

type Meal = {
  id: number
  name: string
  ingredients: Ingredient[]
  servings: number
}

type DayPlan = {
  lunch: { meal: Meal | null, servings: number }
  dinner: { meal: Meal | null, servings: number }
}

type WeekPlan = {
  [key: string]: DayPlan
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const categories = ["Vegetables", "Fruits", "Meat", "Fish", "Dairy", "Grains", "Pasta", "Canned Goods", "Condiments", "Spices", "Beverages", "Snacks", "Baking", "Frozen", "Other"]

export default function MealPlanner() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [weekPlan, setWeekPlan] = useState<WeekPlan>(() => {
    const initialPlan: WeekPlan = {}
    daysOfWeek.forEach(day => {
      initialPlan[day] = { lunch: { meal: null, servings: 1 }, dinner: { meal: null, servings: 1 } }
    })
    return initialPlan
  })
  const [shoppingList, setShoppingList] = useState<{ [category: string]: Ingredient[] }>({})
  const [newMealName, setNewMealName] = useState("")
  const [newMealServings, setNewMealServings] = useState(2)
  const [newIngredients, setNewIngredients] = useState<Ingredient[]>([{ name: "", quantity: 0, unit: "", category: "Other" }])
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)

  useEffect(() => {
    const savedMeals = localStorage.getItem('meals')
    if (savedMeals) {
      setMeals(JSON.parse(savedMeals))
    }

    const savedWeekPlan = localStorage.getItem('weekPlan')
    if (savedWeekPlan) {
      setWeekPlan(JSON.parse(savedWeekPlan))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('meals', JSON.stringify(meals))
  }, [meals])

  useEffect(() => {
    localStorage.setItem('weekPlan', JSON.stringify(weekPlan))
  }, [weekPlan])

  const updateMeal = (day: string, mealType: 'lunch' | 'dinner', mealId: number, servings: number) => {
    const selectedMeal = meals.find(meal => meal.id === mealId) || null
    setWeekPlan(prevPlan => ({
      ...prevPlan,
      [day]: {
        ...prevPlan[day],
        [mealType]: { meal: selectedMeal, servings }
      }
    }))
  }

  const generateShoppingList = () => {
    const ingredientList: { [category: string]: Ingredient[] } = {}
    Object.values(weekPlan).forEach(day => {
      ['lunch', 'dinner'].forEach(mealType => {
        const { meal, servings } = day[mealType as 'lunch' | 'dinner']
        if (meal) {
          const servingRatio = servings / meal.servings
          meal.ingredients.forEach(ing => {
            const category = ing.category || "Other"
            if (!ingredientList[category]) {
              ingredientList[category] = []
            }
            const existingIng = ingredientList[category].find(i => i.name === ing.name && i.unit === ing.unit)
            if (existingIng) {
              existingIng.quantity += ing.quantity * servingRatio
            } else {
              ingredientList[category].push({...ing, quantity: ing.quantity * servingRatio})
            }
          })
        }
      })
    })
    setShoppingList(ingredientList)
  }

  const addNewMeal = () => {
    if (newMealName && newIngredients.length > 0 && newMealServings > 0) {
      const newMeal: Meal = {
        id: meals.length + 1,
        name: newMealName,
        ingredients: newIngredients.filter(ing => ing.name && ing.quantity > 0),
        servings: newMealServings
      }
      setMeals([...meals, newMeal])
      setNewMealName("")
      setNewMealServings(2)
      setNewIngredients([{ name: "", quantity: 0, unit: "", category: "Other" }])
      setIsAddMealDialogOpen(false)
    }
  }

  const addNewIngredient = () => {
    setNewIngredients([...newIngredients, { name: "", quantity: 0, unit: "", category: "Other" }])
  }

  const updateNewIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updatedIngredients = [...newIngredients]
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value }
    setNewIngredients(updatedIngredients)
  }

  const deleteMeal = (id: number) => {
    setMeals(meals.filter(meal => meal.id !== id))
  }

  const editMeal = (meal: Meal) => {
    setEditingMeal(meal)
    setNewMealName(meal.name)
    setNewMealServings(meal.servings)
    setNewIngredients(meal.ingredients)
    setIsAddMealDialogOpen(true)
  }

  const saveMeal = () => {
    if (editingMeal) {
      const updatedMeals = meals.map(meal => 
        meal.id === editingMeal.id 
          ? { ...meal, name: newMealName, servings: newMealServings, ingredients: newIngredients.filter(ing => ing.name && ing.quantity > 0) }
          : meal
      )
      setMeals(updatedMeals)
    } else {
      addNewMeal()
    }
    setEditingMeal(null)
    setIsAddMealDialogOpen(false)
  }

  const shareSchedule = () => {
    const scheduleText = Object.entries(weekPlan)
      .map(([day, plan]) => {
        return `${day}:\nLunch: ${plan.lunch.meal?.name || 'Not set'} (${plan.lunch.servings} servings)\nDinner: ${plan.dinner.meal?.name || 'Not set'} (${plan.dinner.servings} servings)`
      })
      .join('\n\n')
    
    if (navigator.share) {
      navigator.share({
        title: 'My Meal Schedule',
        text: scheduleText,
      }).catch(console.error)
    } else {
      alert('Sharing is not supported on this browser. Here\'s your schedule:\n\n' + scheduleText)
    }
  }

  return (
    <div className="container mx-auto p-4 bg-gradient-to-r from-blue-100 to-green-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-800">Meal Planner Pro</h1>
      <Tabs defaultValue="planner" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="planner">Weekly Planner</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="shopping">Shopping List</TabsTrigger>
        </TabsList>
        <TabsContent value="planner">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {daysOfWeek.map(day => (
              <Card key={day} className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-700">{day}</CardTitle>
                </CardHeader>
                <CardContent>
                  {['lunch', 'dinner'].map((mealType) => (
                    <div key={mealType} className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 capitalize">{mealType}</label>
                        <div className="flex items-center">
                          <Label htmlFor={`${day}-${mealType}-servings`} className="mr-2 text-sm text-gray-600">
                            Servings
                          </Label>
                          <Input
                            id={`${day}-${mealType}-servings`}
                            type="number"
                            value={weekPlan[day][mealType as 'lunch' | 'dinner'].servings}
                            onChange={(e) => updateMeal(day, mealType as 'lunch' | 'dinner', weekPlan[day][mealType as 'lunch' | 'dinner'].meal?.id || 0, Number(e.target.value))}
                            className="w-16 text-center"
                          />
                        </div>
                      </div>
                      <Select onValueChange={(value) => updateMeal(day, mealType as 'lunch' | 'dinner', Number(value), weekPlan[day][mealType as 'lunch' | 'dinner'].servings)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a meal" />
                        </SelectTrigger>
                        <SelectContent>
                          {meals.map(meal => (
                            <SelectItem key={meal.id} value={meal.id.toString()}>{meal.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center space-x-4">
            <Button onClick={generateShoppingList} className="bg-blue-500 hover:bg-blue-600 text-white">Generate Shopping List</Button>
            <Button onClick={shareSchedule} className="bg-green-500 hover:bg-green-600 text-white">
              <Share2 className="w-4 h-4 mr-2" />
              Share Schedule
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="recipes">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {meals.map(meal => (
              <Card key={meal.id} className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-700">{meal.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-2">Servings: {meal.servings}</p>
                  <h4 className="font-semibold mb-1">Ingredients:</h4>
                  <ul className="list-disc pl-5 mb-4">
                    {meal.ingredients.map((ing, index) => (
                      <li key={index} className="text-sm">{`${ing.name}: ${ing.quantity} ${ing.unit}`}</li>
                    ))}
                  </ul>
                  <div className="flex justify-end space-x-2">
                    <Button onClick={() => editMeal(meal)} variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button onClick={() => deleteMeal(meal.id)} variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center">
            <Dialog open={isAddMealDialogOpen} onOpenChange={setIsAddMealDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-500 hover:bg-green-600 text-white">Add New Recipe</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingMeal ? 'Edit Recipe' : 'Add New Recipe'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="meal-name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="meal-name"
                      value={newMealName}
                      onChange={(e) => setNewMealName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="meal-servings" className="text-right">
                      Servings
                    </Label>
                    <Input
                      id="meal-servings"
                      type="number"
                      value={newMealServings}
                      onChange={(e) => setNewMealServings(Number(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                  {newIngredients.map((ing, index) => (
                    <div key={index} className="grid grid-cols-4 items-center gap-4">
                      <Input
                        placeholder="Ingredient"
                        value={ing.name}
                        onChange={(e) => updateNewIngredient(index, 'name', e.target.value)}
                      />
                      <Input
                        type="number"
                        
                        placeholder="Quantity"
                        value={ing.quantity}
                        onChange={(e) => updateNewIngredient(index, 'quantity', Number(e.target.value))}
                      />
                      <Input
                        placeholder="Unit"
                        value={ing.unit}
                        onChange={(e) => updateNewIngredient(index, 'unit', e.target.value)}
                      />
                      <Select onValueChange={(value) => updateNewIngredient(index, 'category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  <Button onClick={addNewIngredient} variant="outline">Add Ingredient</Button>
                </div>
                <Button onClick={saveMeal}>{editingMeal ? 'Save Changes' : 'Add Recipe'}</Button>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
        <TabsContent value="shopping">
          {Object.keys(shoppingList).length > 0 ? (
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-700">Shopping List</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(shoppingList).map(([category, ingredients]) => (
                  <div key={category} className="mb-4">
                    <h3 className="font-semibold mb-2 text-blue-600">{category}</h3>
                    <ul className="list-disc pl-5">
                      {ingredients.map((ing, index) => (
                        <li key={index} className="text-sm">{`${ing.name}: ${ing.quantity.toFixed(2)} ${ing.unit}`}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-gray-600">Generate a shopping list from your meal plan to see it here.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
