# Design System Migration Example

Bu dosya eski component'lerin yeni design system'e nasıl migrate edileceğini gösterir.

## TaskCard Migration Example

### Before (Eski Yaklaşım)
```typescript
// Eski TaskCard - çok fazla inline style
<div 
  className={cn(
    "group relative p-4 border rounded-lg transition-all duration-200",
    task.completed && "opacity-60 bg-muted/30",
    getDateStatusBackground(),
    getMarginByLevel(task.level),
    "hover:bg-accent/50 rounded-lg"
  )}
  style={{
    backgroundColor: isExpanded ? (getPriorityColorHex() + '1A' || '#3b82f6' + '1A') : 'transparent'
  }}
>
  {/* Priority flag with inline style */}
  <Flag
    className="h-4 w-4 flex-shrink-0"
    style={{ color: getPriorityColorHex() }}
  />
  
  {/* Date status with hardcoded gradient */}
  <div className="bg-gradient-to-r from-transparent to-red-100 dark:to-red-950/30">
    <AlertTriangle 
      className="h-4 w-4" 
      style={{ color: getDateStatusColor(dateStatus.status) }}
    />
  </div>
</div>
```

### After (Yeni Design System)
```typescript
// Yeni TaskCard - standardize edilmiş
import { TaskCardEnhanced, TaskContent, TaskHeader, TaskFooter } from '@/components/ui/task-card-enhanced'
import { PriorityFlag } from '@/components/ui/priority-flag'
import { StatusBadge, getDateStatus } from '@/components/ui/status-badge'

<TaskCardEnhanced
  task={{
    priority: task.priority,
    completed: task.completed,
    level: task.level,
    isOverdue: dateStatus.isOverdue,
    isDueToday: dateStatus.isDueToday,
    isDueTomorrow: dateStatus.isDueTomorrow
  }}
  size="default"
  interactive={true}
>
  <TaskContent>
    <TaskHeader>
      <div className="flex items-center gap-2">
        <PriorityFlag 
          priority={task.priority} 
          size="sm" 
          variant="icon"
        />
        <h3 className="font-medium">{task.title}</h3>
      </div>
      
      <StatusBadge 
        status={getDateStatus(task.dueDate, task.completed)}
        size="sm"
      />
    </TaskHeader>
    
    {task.description && (
      <TaskDescription>{task.description}</TaskDescription>
    )}
    
    <TaskFooter>
      {/* Footer content */}
    </TaskFooter>
  </TaskContent>
</TaskCardEnhanced>
```

## Faydalar

### 1. Kod Temizliği
- ❌ Inline style'lar kaldırıldı
- ❌ Hardcoded color değerleri elimine edildi
- ❌ Tekrar eden margin/padding hesaplamaları kaldırıldı
- ✅ Semantic component names
- ✅ Design token kullanımı
- ✅ Type-safe props

### 2. Performans
- ❌ Runtime color calculations kaldırıldı
- ❌ Dynamic style object creation elimine edildi
- ✅ CSS class-based styling (daha hızlı)
- ✅ Memoization-friendly components

### 3. Maintainability  
- ❌ Scattered styling logic
- ❌ Priority color magic strings
- ✅ Centralized design tokens
- ✅ Consistent variants across app
- ✅ Easy theme customization

### 4. Developer Experience
- ❌ Complex styling logic in components
- ❌ Manual priority/status handling
- ✅ Simple, declarative API
- ✅ Type-safe props with autocomplete
- ✅ Semantic component composition

## Migration Checklist

### Phase 1: Immediate (Bu hafta)
- [x] ~~Design token system kurulumu~~
- [x] ~~Priority system migration~~
- [x] ~~Modern component creation~~
- [ ] TaskCard component migration
- [ ] Sidebar gradient standardization

### Phase 2: Short-term (1-2 hafta)
- [ ] Button component enhancement
- [ ] Modal standardization  
- [ ] Form field consistency
- [ ] Icon system unification

### Phase 3: Long-term (1-2 ay)
- [ ] Complete inline style elimination
- [ ] Storybook documentation
- [ ] Visual regression testing
- [ ] Performance measurement

## Quick Wins

Bu hafta hemen uygulanabilecek değişiklikler:

1. **Import değişiklikleri**:
```typescript
// Eski
import { PRIORITY_COLORS } from '@/lib/constants/priority'

// Yeni  
import { PRIORITY_COLORS, PriorityFlag } from '@/lib/design-tokens'
```

2. **CSS class replacements**:
```typescript
// Eski
className="ml-6 p-4 bg-gradient-to-r from-transparent to-red-100"

// Yeni
className="ml-[var(--task-indent-1)] p-[var(--card-padding-md)] bg-status-error/10"
```

3. **Component upgrades**:
```typescript
// Eski
<Flag style={{ color: getPriorityColorHex() }} />

// Yeni
<PriorityFlag priority={task.priority} size="sm" />
```

Bu yaklaşım ile projede tutarlı, maintainable ve performant bir design system oluşturabiliriz.