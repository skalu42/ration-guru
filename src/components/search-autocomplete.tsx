import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Trending, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchAutocompleteProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  searchHistory: string[];
  onClearHistory: () => void;
}

const POPULAR_ITEMS = [
  "Aashirvaad Atta 5kg",
  "Amul Gold Milk 1L",
  "Tata Salt 1kg",
  "Fortune Rice Bran Oil 1L",
  "Britannia Good Day Cookies",
  "Maggi Noodles 2 Minute",
  "Surf Excel Detergent",
  "Colgate Toothpaste",
  "Dettol Handwash",
  "Red Label Tea 250g",
  "Sugar 1kg",
  "Onion 1kg",
  "Potato 1kg",
  "Tomato 1kg",
  "Basmati Rice 5kg"
];

const SUGGESTIONS = [
  "atta", "flour", "wheat", "rice", "dal", "oil", "milk", "sugar", "salt", "tea", "coffee",
  "biscuits", "cookies", "noodles", "pasta", "bread", "butter", "cheese", "yogurt", "paneer",
  "onion", "potato", "tomato", "garlic", "ginger", "green chili", "coriander", "mint",
  "detergent", "soap", "shampoo", "toothpaste", "tissue", "toilet paper"
];

export const SearchAutocomplete = ({ onSearch, isLoading, searchHistory, onClearHistory }: SearchAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = SUGGESTIONS.filter(item => 
        item.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
    setQuery('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for products (e.g., Aashirvaad Atta 5kg, Amul Milk...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => query.length === 0 && setShowSuggestions(true)}
          className="pl-12 pr-24 py-6 text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-card/50 backdrop-blur-sm"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isLoading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 rounded-lg"
        >
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-elegant border-primary/20">
          <CardContent className="p-0">
            {/* Search History */}
            {searchHistory.length > 0 && query.length === 0 && (
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Recent Searches
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearHistory}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.slice(0, 5).map((item, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => handleSuggestionClick(item)}
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Autocomplete Suggestions */}
            {filteredSuggestions.length > 0 && (
              <div className="p-2">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-sm"
                  >
                    <span className="capitalize">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Items */}
            {query.length === 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                  <Trending className="w-4 h-4" />
                  Popular Items
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {POPULAR_ITEMS.slice(0, 8).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(item)}
                      className="text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-sm"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};