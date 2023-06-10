module.exports = {
    pagesBuilder: function(elements){
        const pages  = [[]];
        for(const element of elements){
            if(pages.at(-1).length === 10){
                pages.push([]);
            }
            pages.at(-1).push(element);
        }
        return pages;
    }
}