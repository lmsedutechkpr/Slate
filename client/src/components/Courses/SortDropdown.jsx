import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, TrendingUp, Star, Calendar, Users } from 'lucide-react';

const SortDropdown = ({ value, onValueChange, className = "" }) => {
  const sortOptions = [
    {
      value: 'popular',
      label: 'Most Popular',
      icon: TrendingUp,
      description: 'By enrollment count'
    },
    {
      value: 'rating',
      label: 'Highest Rated',
      icon: Star,
      description: 'By average rating'
    },
    {
      value: 'newest',
      label: 'Newest',
      icon: Calendar,
      description: 'By creation date'
    },
    {
      value: 'students',
      label: 'Most Students',
      icon: Users,
      description: 'By student count'
    },
    {
      value: 'title',
      label: 'Alphabetical',
      icon: ArrowUpDown,
      description: 'A to Z'
    }
  ];

  const selectedOption = sortOptions.find(option => option.value === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`w-48 ${className}`}>
        <div className="flex items-center space-x-2">
          {selectedOption && <selectedOption.icon className="w-4 h-4 text-gray-500" />}
          <SelectValue placeholder="Sort by">
            {selectedOption ? selectedOption.label : 'Sort by'}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => {
          const Icon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default SortDropdown;
