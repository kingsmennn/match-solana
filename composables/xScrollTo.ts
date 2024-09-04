export function useXScrollTo({overflowContainer, listWrapper}: {overflowContainer?: string | HTMLElement, listWrapper: string}) {
  return function (index: number) {
    if(process.server) return
    //get current position of the element
    let container: HTMLElement
    let element: HTMLElement
    if(overflowContainer) {
      container = typeof overflowContainer === 'string' ? document.querySelector(overflowContainer) as HTMLElement : overflowContainer
      element = (container.querySelector(listWrapper) as HTMLElement).children[Math.max(index,0)] as HTMLElement
    } else {
      container = document.querySelector(listWrapper) as HTMLElement
      if(!container || !container?.children) return
      element = container.children[Math.max(index,0)] as HTMLElement
    }
    //scroll to the element if element is not visible
    if(!!element?.offsetLeft && !!container?.scrollLeft && !!container?.offsetWidth) {}
    else return
    if (
      element?.offsetLeft < container?.scrollLeft ||
      element.offsetLeft + element.offsetWidth >
        container.scrollLeft + container.offsetWidth
    ) {
      //scroll element to center of container
      container.scrollTo({
        left: element.offsetLeft - container.offsetWidth / 2,
        behavior: 'smooth',
      })
    }
  }
}
