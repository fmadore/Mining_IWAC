import pandas as pd
import stanza
from wordcloud import WordCloud
import matplotlib.pyplot as plt

# Download the French model for Stanza
stanza.download('fr')
nlp = stanza.Pipeline('fr')

def load_data(url):
    """Load data from URL."""
    return pd.read_csv(url)

def filter_integrisme_articles(df):
    """Filter articles mentioning 'intégrisme'."""
    return df[df['dcterms:subject'].fillna('').str.contains('Intégrisme', case=False)]

def preprocess_text(text):
    """Preprocess text: tokenize, remove stopwords, and lemmatize using Stanza."""
    doc = nlp(text)
    tokens = [word.lemma.lower() for sentence in doc.sentences for word in sentence.words if word.text.isalpha()]
    return ' '.join(tokens)

def generate_wordcloud(text):
    """Generate and display a word cloud."""
    wordcloud = WordCloud(width=800, height=400, background_color='white').generate(text)
    
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud, interpolation='bilinear')
    plt.axis('off')
    plt.show()

def main():
    """Main function to run the word cloud generation."""
    # URL for the data
    url = "https://raw.githubusercontent.com/fmadore/Islam-West-Africa-Collection/main/Metadata/CSV/newspaper_articles.csv"
    
    # Load data
    df = load_data(url)
    
    # Filter articles mentioning "intégrisme"
    integrisme_articles = filter_integrisme_articles(df)
    
    # Preprocess text in "bibo:content"
    integrisme_articles['processed_content'] = integrisme_articles['bibo:content'].fillna('').apply(preprocess_text)
    
    # Concatenate all processed content
    all_text = ' '.join(integrisme_articles['processed_content'])
    
    # Generate word cloud
    generate_wordcloud(all_text)

if __name__ == "__main__":
    main() 