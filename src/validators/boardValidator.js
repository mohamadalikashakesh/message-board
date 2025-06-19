
// Validate board title

export const validateBoardTitle = (title) => {
  if (!title || title.length < 3 || title.length > 100) {
    throw new Error('Board title must be between 3 and 100 characters');
  }
  return title;
};


// Validate board description

export const validateBoardDescription = (description) => {
  if (!description || description.length < 10 || description.length > 500) {
    throw new Error('Board description must be between 10 and 500 characters');
  }
  return description;
};

// Validate message content

export const validateMessageContent = (content) => {
  if (!content || content.length < 1 || content.length > 1000) {
    throw new Error('Message content must be between 1 and 1000 characters');
  }
  return content;
}; 