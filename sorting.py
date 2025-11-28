def partition_by_confidence(arr, low, high):
    # Use the last element as the pivot (based on 'fingerprinted_confidence')
    pivot = arr[high]['fingerprinted_confidence']
    i = low - 1  # Pointer for the smaller element
    
    # Rearrange the array to put elements with lower confidence on the left of the pivot
    for j in range(low, high):
        if arr[j]['fingerprinted_confidence'] >= pivot:  # We want high to low sorting
            i += 1
            arr[i], arr[j] = arr[j], arr[i]  # Swap if element has higher confidence than pivot

    # Swap the pivot element with the element at index i + 1
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    
    return i + 1

def quick_sort_by_confidence(arr, low, high):
    # Base case: if the list has 1 or no elements, it's already sorted
    if low < high:
        # Partition the array and get the pivot index
        pi = partition_by_confidence(arr, low, high)
        
        # Recursively sort the left and right sub-arrays
        quick_sort_by_confidence(arr, low, pi - 1)
        quick_sort_by_confidence(arr, pi + 1, high)